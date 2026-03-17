# Uninstall Skill Control Flow

Status: Draft

## Goal

Define the product behavior and control-plane semantics for uninstalling a skill
from the global Skills directory.

In this product, uninstall is the user-facing operation for removing a globally
enabled skill. There is no separate disable behavior.

This PRD exists to clarify what "success" means for:

- request acceptance
- user-level skill removal
- per-project skill uninstallation
- removal of future project inheritance
- handling projects that are not currently runnable
- uninstall failure handling

## Scope

This document covers the current product contract for:

- uninstalling a skill globally for a user
- treating global uninstall as removal of the skill from all existing projects
- ensuring future projects no longer inherit that skill
- removing the globally persisted skill record that includes that skill's `installCommand`
- creating uninstall-skill work for projects that must converge to "not installed"
- preventing stale install intent from re-applying the skill after uninstall
- waiting to execute sandbox-side uninstall until a project's sandbox is runnable

This document does not define:

- a separate disable workflow
- skill catalog or marketplace design
- skill version rollback policy
- auto-starting stopped projects only to uninstall skills
- bulk operator tooling for failed uninstalls

## User Intent

When a user uninstalls a skill from the global Skills tab, the system receives
three requested outcomes:

1. Remove the skill from the user's global desired state
2. Ensure every existing project owned by that user converges to "skill not installed"
3. Ensure future projects owned by that user no longer inherit that skill

These outcomes are related, but they are not treated as a single synchronous
"remove it everywhere right now" success condition.

In particular:

- a stopped project does not need to be started immediately
- a project may remain pending uninstall until its sandbox becomes `RUNNING`
- a global uninstall remains valid even if some project uninstalls have not yet completed

## Success Semantics

### Request acceptance success

The uninstall request is considered accepted when the control plane successfully
persists enough state to guarantee future convergence to "not installed."

At minimum, this means:

- the user-level global enablement for that skill is removed or marked inactive
- the persisted `installCommand` associated with that user-level skill record is removed
  together with that global record
- future project creation can discover that the skill is no longer globally enabled
- the system has persisted uninstall intent or equivalent convergence state for
  current projects that still need removal

The API may return success immediately even though:

- some projects are currently stopped
- some uninstall tasks have not started yet
- some running projects have not yet finished uninstalling inside the sandbox

### User-level uninstall success

A skill is considered uninstalled for a user when the global enablement state is
removed successfully.

This is the source of truth for whether the skill should still apply to the
user's projects.

User-level uninstall success does not require:

- every existing project to have already finished uninstalling
- any stopped project to be started automatically

### Existing project coverage success

An existing project is considered covered by a global uninstall when the control
plane has persisted enough state to ensure that the project will not retain the
skill indefinitely.

For a currently running project, this normally means an `UNINSTALL_SKILL` task
can proceed immediately.

For a stopped or otherwise non-runnable project, this means uninstall work may
remain pending until prerequisites are satisfied.

For a project that never successfully installed the skill, coverage success may
be satisfied by cancelling stale install intent or recording that no uninstall
work is required.

### Project uninstall success

A project is considered to have completed uninstall only when the skill is no
longer present for that project.

This may happen through:

- successful execution of an `UNINSTALL_SKILL` task
- successful cancellation or invalidation of stale install intent before the
  skill was ever installed
- a no-op terminal outcome for a project that already does not have the skill

Project uninstall success is independent from user-level uninstall success.

### Future project removal success

If a user has uninstalled a skill globally, newly created projects must not
receive install work for that skill.

This means future project creation must consult the latest user-level desired
state rather than historical install attempts.

## Failure Semantics

### Global uninstall persistence failure

If the system cannot remove the user-level enablement state, the request fails.

The skill must continue to appear enabled for the user in this case.

### Existing project fan-out failure

The system must not silently remove a skill for only some of the user's current
projects while leaving others with no durable convergence path.

If immediate fan-out cannot fully complete during request handling, the system
must still preserve durable control-plane state that guarantees missing projects
will be reconciled later.

The system must not rely on best-effort in-memory fan-out alone.

### Project uninstall failure

If uninstall fails for one project, the system must:

- keep the global uninstall in effect for the user
- keep the project intact
- keep the sandbox intact
- mark uninstall as failed for that project
- allow other projects to continue uninstalling independently

Project uninstall failure does not re-enable the skill globally.

Examples include:

- sandbox command execution failure
- timeout while uninstalling inside the sandbox
- repository state that prevents safe removal
- transient access or environment failures inside the sandbox

### Non-runnable project state

If a project's sandbox is not `RUNNING`, this is not itself an uninstall
failure.

Instead:

- the uninstall task remains pending or waiting for prerequisites
- the project should not be auto-started solely to satisfy skill uninstall
- uninstall should proceed when the sandbox later becomes runnable

### Stale install intent after uninstall

Once a global uninstall request is accepted, older install intent must not later
re-apply the skill.

This means the system must ensure that:

- pending `INSTALL_SKILL` work for that same skill does not win over the newer
  uninstall intent
- a project does not end in `INSTALLED` solely because an older install task ran
  after the user already uninstalled the skill globally

The latest desired state must win.

## Status Requirements

The system should represent three distinct layers of state:

1. User-level skill desired state
2. Project resource status
3. Project-level skill uninstall status

### User-level skill desired state

The system must persist whether a skill is currently globally enabled for a user.

After uninstall is accepted, this state means:

- the skill no longer applies to current projects as desired state
- the skill no longer applies to future projects

This state is not the same as project uninstall completion.

Before uninstall, the user-level skill record is also the source of truth for
that skill's `installCommand`.

### Project resource status

`Project.status` continues to mean resource lifecycle state only.

Examples:

- `RUNNING`
- `STOPPED`
- `STARTING`
- `ERROR`

Skill uninstall must not be folded into `Project.status`.

### Project-level skill uninstall status

For the current product contract, project-level uninstall status may be derived
from the latest effective task or terminal no-op outcome for a given project and
skill.

Derived meaning:

- `WAITING_FOR_PREREQUISITES` or `PENDING` => `PENDING_UNINSTALL`
- `RUNNING` => `UNINSTALLING`
- `SUCCEEDED` => `UNINSTALLED`
- `FAILED` or `CANCELLED` => `UNINSTALL_FAILED`

This allows valid combinations such as:

- user skill uninstalled + project `STOPPED` + project skill `PENDING_UNINSTALL`
- user skill uninstalled + project `RUNNING` + project skill `UNINSTALL_FAILED`
- user skill uninstalled + project `RUNNING` + project skill `UNINSTALLED`

## UI Requirements

For the current phase of the product:

- the global Skills tab should stop showing the skill as enabled once durable
  uninstall state is created
- the UI should not wait for all projects to finish uninstall before reflecting
  the global uninstall
- stopped projects should not be presented as immediate uninstall failures
- if surfaced later, project-level UI should distinguish `PENDING_UNINSTALL`
  from `UNINSTALL_FAILED`

No dedicated bulk progress dashboard is required in this phase.

## Retry Behavior

Skill uninstall should automatically retry up to 3 times, matching the current
project task retry model.

Requirements:

- retries are automatic
- waiting for sandbox prerequisites is not counted as terminal failure
- exhausting retries should leave the global uninstall in effect
- no manual retry UX is required in this phase

## Persistence Requirements

The system must persist enough state to represent:

- that the skill is no longer globally enabled for the user
- the stable identity of that skill
- that current projects have uninstall intent or equivalent no-op resolution
- that future projects no longer inherit the skill
- whether uninstall for a given project eventually succeeded or failed

This currently implies the need for:

- a persisted `UserSkill` record that can be removed or marked inactive
- stable `UserSkill` fields that include at least:
  - `userId`
  - `skillId`
  - `installCommand`
- `ProjectTask` records for project-level uninstall attempts when removal work is needed
- a way to invalidate or supersede stale install intent for the same skill
- task payload that includes at least:
  - `userSkillId`
  - `skillId`
  - `installCommand`
- task result or error data that records project-level uninstall outcome

If uninstall fails for one project, the database must still clearly reflect:

- the skill is no longer globally enabled for the user
- the affected project has not yet completed uninstall successfully
- future projects should not inherit that skill

## Skill Identity Requirements

Global uninstall and project uninstall records must reference a stable skill
identity rather than only a display label.

This means:

- renaming a skill in the catalog must not orphan uninstall state
- project uninstall tasks must remain attributable to the intended skill
- stale install and newer uninstall intent can be compared for the same skill identity

## Install Command Requirements

For the current phase of the product:

- each globally enabled skill is represented by a `UserSkill` record that includes
  `installCommand`
- uninstall removes that global `UserSkill` desired state
- historical uninstall and install tasks may still retain `installCommand` in their
  payload as execution snapshots
- uninstall execution should rely on task payload and task semantics rather than
  attempting to rebuild prior install intent from mutable runtime state

## Non-Goals

This PRD does not define:

- a separate disable behavior
- skill version downgrade or rollback policy
- automatic starting of stopped sandboxes for uninstall purposes
- manual retry controls
- organization-scoped or team-scoped skill policies
- UI for bulk project-by-project repair operations
- deletion of historical task records

## Implementation Notes

Current implementation should preserve this product contract:

- the user action removes a skill at the global user scope, not the single-project scope
- the removed global skill record is the `UserSkill` source of truth that previously
  held the skill's `installCommand`
- project uninstall is asynchronous and should run through `ProjectTask`
- uninstall and stale install resolution should operate on tasks that retain
  `installCommand` snapshots in payload
- uninstall execution should happen only when a project's sandbox is `RUNNING`
- sandbox lifecycle state remains separate from skill uninstall state
- future project creation should consult the latest global desired state and not
  recreate install work for an uninstalled skill
- stale install work must not override a newer global uninstall

Current codebase note:

- `ProjectTaskType` already reserves `INSTALL_SKILL` and `UNINSTALL_SKILL`
- task prerequisite evaluation already matches the desired sandbox `RUNNING` gate
- uninstall executor, task supersession rules, and global enabled-skill persistence
  model are not yet implemented

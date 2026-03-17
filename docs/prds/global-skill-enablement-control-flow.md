# Global Skill Enablement Control Flow

Status: Draft

## Goal

Define the product behavior and control-plane semantics for enabling a skill from
the global Skills directory.

This PRD exists to clarify what "success" means for:

- request acceptance
- user-level skill enablement
- per-project skill installation
- coverage of existing projects
- coverage of future projects
- install failure handling

## Scope

This document covers the current product contract for:

- enabling a skill globally for a user
- persisting the install command associated with that globally enabled skill
- treating a globally enabled skill as applicable to all of the user's projects
- creating install-skill work for all existing projects owned by that user
- ensuring newly created projects also receive install-skill work
- waiting to execute installation until a project's sandbox is runnable
- representing project-level install failure without disabling the skill globally

This document does not define:

- disabling or uninstalling a skill
- skill marketplace or discovery design
- skill version pinning or upgrade policy
- auto-starting stopped projects only to install skills
- detailed project-level skill UI beyond required status semantics

## User Intent

When a user enables a skill from the global Skills tab, the system receives three
requested outcomes:

1. Mark the skill as enabled for that user at the global level
2. Ensure every existing project owned by that user will install the skill
3. Ensure every future project owned by that user will also install the skill

These outcomes are related, but they are not treated as a single synchronous
"install everywhere now" success condition.

In particular:

- a stopped project does not need to be started immediately
- a project may remain pending installation until its sandbox becomes `RUNNING`
- the global enablement remains valid even if some project installations have not yet completed

## Success Semantics

### Request acceptance success

The enable request is considered accepted when the control plane successfully
persists enough state to guarantee global coverage.

At minimum, this means:

- the user-skill global enablement is persisted
- the skill's stable identity and `installCommand` are persisted with that global record
- the system has persisted install intent for all current projects owned by the user
- future project creation can discover that this skill is globally enabled

The API may return success immediately even though:

- some projects are currently stopped
- some install tasks have not started yet
- no sandbox-side installation work has completed yet

### User-level enablement success

A skill is considered enabled for a user when the global enablement state is
persisted successfully.

This is the source of truth for whether the skill should apply to the user's
projects.

User-level enablement success does not require:

- every existing project to have already finished installation
- any stopped project to be started automatically

### Existing project coverage success

An existing project is considered covered by a globally enabled skill when the
control plane has persisted installation work for that project.

For a currently running project, this normally means an `INSTALL_SKILL` task can
proceed immediately.

For a stopped or otherwise non-runnable project, this means an `INSTALL_SKILL`
task may remain pending until prerequisites are satisfied.

### Project installation success

A project is considered to have the skill available only when installation for
that project succeeds.

This is independent from user-level enablement success.

### Future project coverage success

If a user already has a skill enabled globally, every newly created project must
inherit that desired state automatically.

This means project creation should also create install work for each globally
enabled skill, even if the new project's sandbox is not yet runnable.

## Failure Semantics

### Global enablement persistence failure

If the system cannot persist the user-level enablement, the request fails.

The skill must not appear enabled for the user in this case.

### Existing project fan-out failure

The system must not silently enable a skill for only some of the user's current
projects.

If immediate fan-out cannot fully complete during request handling, the system
must still preserve durable control-plane state that guarantees missing projects
will be reconciled later.

The system must not rely on best-effort in-memory fan-out alone.

### Project installation failure

If installation fails for one project, the system must:

- keep the user-level skill enablement active
- keep the project intact
- keep the sandbox intact
- mark installation as failed for that project
- allow other projects to continue installing independently

Project installation failure does not disable the skill globally.

Examples include:

- sandbox command execution failure
- timeout while installing inside the sandbox
- missing files or incompatible repository structure
- transient access or environment failures inside the sandbox

### Non-runnable project state

If a project's sandbox is not `RUNNING`, this is not itself an installation
failure.

Instead:

- the install task remains pending or waiting for prerequisites
- the project should not be auto-started solely to satisfy skill installation
- installation should proceed when the sandbox later becomes runnable

## Status Requirements

The system should represent three distinct layers of state:

1. User-level skill enablement state
2. Project resource status
3. Project-level skill installation status

### User-level skill enablement state

The system must persist whether a skill is globally enabled for a user.

This state means:

- the skill should apply to all current projects
- the skill should apply to all future projects

This state is not the same as project installation success.

The user-level skill record must also persist the install command used to apply
that skill to projects.

### Project resource status

`Project.status` continues to mean resource lifecycle state only.

Examples:

- `CREATING`
- `STARTING`
- `RUNNING`
- `STOPPED`
- `ERROR`

Skill enablement and skill installation must not be folded into `Project.status`.

### Project-level skill installation status

For the current product contract, project-level skill installation status may be
derived from the latest `INSTALL_SKILL` task for a given project and skill.

Derived meaning:

- `WAITING_FOR_PREREQUISITES` or `PENDING` => `PENDING_INSTALL`
- `RUNNING` => `INSTALLING`
- `SUCCEEDED` => `INSTALLED`
- `FAILED` or `CANCELLED` => `INSTALL_FAILED`

This allows valid combinations such as:

- user skill enabled + project `STOPPED` + project skill `PENDING_INSTALL`
- user skill enabled + project `RUNNING` + project skill `INSTALL_FAILED`
- user skill enabled + project `RUNNING` + project skill `INSTALLED`

## UI Requirements

For the current phase of the product:

- the global Skills tab should reflect user-level enablement state
- enabling a skill should return quickly after durable state is created
- the UI should not wait for all projects to finish installation before showing the skill as enabled
- stopped projects should not be presented as immediate installation failures
- if surfaced later, project-level UI should distinguish `PENDING_INSTALL` from `INSTALL_FAILED`

No dedicated bulk progress dashboard is required in this phase.

## Retry Behavior

Skill installation should automatically retry up to 3 times, matching the current
project task retry model.

Requirements:

- retries are automatic
- waiting for sandbox prerequisites is not counted as terminal failure
- exhausting retries should leave the global skill enablement intact
- no manual retry UX is required in this phase

## Persistence Requirements

The system must persist enough state to represent:

- that a skill is globally enabled for a user
- the stable identity of that skill
- that every current project has installation intent
- that future projects can inherit globally enabled skills
- whether installation for a given project eventually succeeded or failed

This currently implies the need for:

- a persisted `UserSkill` record
- stable `UserSkill` fields that include at least:
  - `userId`
  - `skillId`
  - `installCommand`
- `ProjectTask` records for project-level install attempts
- task payload that includes at least:
  - `userSkillId`
  - `skillId`
  - `installCommand`
- task result or error data that records project-level install outcome

If installation fails for one project, the database must still clearly reflect:

- the skill remains enabled globally for the user
- the affected project has not yet installed it successfully
- other projects are unaffected by that single-project failure

## Skill Identity Requirements

Global enablement and project installation records must reference a stable skill
identity rather than only a display label.

This means:

- renaming a skill in the catalog must not orphan existing enablement state
- project install tasks must remain attributable to the intended skill
- install failure must not erase the user-to-skill association

## Install Command Requirements

Each globally enabled skill must persist an `installCommand`.

For the current phase of the product:

- `installCommand` is part of the user-level enabled-skill record
- project install tasks should receive `installCommand` in their payload
- install execution should consume the command from task payload rather than
  inferring installation behavior dynamically at runtime
- the current phase does not define editing an existing enabled skill's
  `installCommand`

## Non-Goals

This PRD does not define:

- uninstall or disable behavior
- skill marketplace ranking, browsing, or recommendation logic
- version selection, upgrade rollout, or migration policy
- automatic starting of stopped sandboxes for install purposes
- manual retry controls
- organization-scoped or team-scoped skill enablement
- post-install analysis or deployment behavior triggered by the skill

## Implementation Notes

Current implementation should preserve this product contract:

- the user action enables a skill at the global user scope, not the single-project scope
- `UserSkill` is the durable source of truth for the enabled skill and its `installCommand`
- project installation is asynchronous and should run through `ProjectTask`
- each `INSTALL_SKILL` task should contain an execution snapshot of the `installCommand`
- install execution should happen only when a project's sandbox is `RUNNING`
- sandbox lifecycle state remains separate from skill installation state
- future project creation should consult globally enabled skills and create install work automatically

Current codebase note:

- `ProjectTaskType` already reserves `INSTALL_SKILL` and `UNINSTALL_SKILL`
- task prerequisite evaluation already matches the desired sandbox `RUNNING` gate
- the install-skill executor and global enabled-skill persistence model are not yet implemented

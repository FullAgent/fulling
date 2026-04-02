# Global Skills

## Purpose

This domain defines shared skill desired state for a user and fans that state out across projects through asynchronous tasks.

## User-Facing Surfaces

- `/skills` - global skill library

## Main Flows

- Enable a global skill and create `INSTALL_SKILL` tasks for existing projects.
- Inherit currently enabled skills when new projects are created.
- Uninstall a global skill, cancel stale pending installs, and create `UNINSTALL_SKILL` tasks where removal is still needed.
- Execute install and uninstall commands inside project sandboxes after prerequisite checks pass.

## Supporting APIs

This domain does not currently expose a dedicated REST route. The UI uses server actions:

- `enableGlobalSkill`
- `uninstallGlobalSkill`

## Key Modules

- `app/(dashboard)/skills/_components/skills-library.tsx` - skills UI
- `lib/actions/skill.ts` - server action entrypoints
- `lib/skills/catalog.ts` - source of available skills
- `lib/platform/control/commands/skill/enable-global-skill.ts`
- `lib/platform/control/commands/skill/uninstall-global-skill.ts`
- `lib/jobs/project-task/executors/install-skill.ts`
- `lib/jobs/project-task/executors/uninstall-skill.ts`

## Constraints

- The current catalog is intentionally small; only `frontend-design` is present in code today.
- Skill rollout depends on sandbox availability and, for imported projects, clone task completion.
- Uninstall does not auto-start stopped sandboxes just to remove a skill.


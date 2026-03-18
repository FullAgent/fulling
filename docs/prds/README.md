# PRDs

This directory stores implementation-facing product requirement documents for the
current Fulling codebase.

## What belongs here

Put documents here when they define product behavior that directly affects:

- control-plane state
- UI-visible status semantics
- retry behavior
- persistence requirements
- API or workflow expectations for a concrete feature

Examples:

- import project control flow
- deploy project workflow
- install skill behavior
- database creation UX and state semantics

## What does not belong here

Do not put high-level strategy, roadmap thinking, or long-range architecture vision here.
Those should stay in the handbook project space.

Recommended split:

- `handbook/projects/fulling/`
  - vision
  - roadmap
  - version plans
  - postmortems
  - architecture direction
- `docs/prds/`
  - implementation-facing feature requirements for the repository

## Naming

- One PRD per feature or workflow
- Use stable kebab-case file names
- Prefer names like `import-project-control-flow.md`
- Related PRDs may be grouped under a feature directory such as `skills/`

## Suggested PRD structure

Each PRD should usually include:

1. Goal
2. Scope
3. Success semantics
4. Failure semantics
5. State requirements
6. UI requirements
7. Retry behavior
8. Persistence requirements
9. Non-goals

## Current PRDs

- [Import Project Control Flow](./import-project-control-flow.md)
- [Skills / Global Skill Enablement Control Flow](./skills/global-skill-enablement-control-flow.md)
- [Skills / Uninstall Skill Control Flow](./skills/uninstall-skill-control-flow.md)

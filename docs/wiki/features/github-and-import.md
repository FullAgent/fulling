# GitHub and Import

## Purpose

This domain connects Fulling projects to GitHub for repository import, installation tracking, and push-back to GitHub.

## User-Facing Surfaces

- project import dialog from `/projects`
- `/github/app/callback` - GitHub App install completion page
- `/projects/[id]/github` - repository initialize and push surface
- `/settings/integrations` - GitHub installation status summary

## Main Flows

- Install the GitHub App through a popup flow and persist the resulting installation.
- Select a repository from the installation and create a project in import mode.
- Wait for the sandbox to reach `RUNNING`, then clone the selected repository into the sandbox through a queued task.
- Initialize a new Git repository for a blank project and push changes back to GitHub from the project GitHub page.

## Supporting APIs

- `GET /api/github/app/callback` - installation binding
- `POST /api/github/app/webhook` - installation lifecycle updates
- `GET /api/projects/[id]` - import progress polling through project tasks

## Key Modules

- `app/(dashboard)/projects/_components/import-github-dialog.tsx` - repository picker and import progress poller
- `lib/actions/github.ts` - installation and repository reads
- `lib/actions/project.ts` - import action entrypoint
- `lib/platform/control/commands/project/create-project-from-github.ts` - import intent creation
- `lib/jobs/project-task/executors/clone-repository.ts` - in-sandbox clone execution
- `lib/services/github-app.ts` - GitHub App and OAuth service layer
- `lib/services/repoService.ts` - repo initialization and push helper for already-created projects

## Constraints

- Organization GitHub App installations are explicitly rejected today.
- Imported repositories are cloned into `/home/fulling/next/import/<repo>-<projectId>`.
- The GitHub page for existing projects uses ttyd command execution and a `claude -p` commit command inside the sandbox when initializing and committing repositories.


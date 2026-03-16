# Import Project Control Flow

Status: Draft

## Goal

Define the product behavior and control-plane semantics for importing a GitHub
repository as a Fulling project.

This PRD exists to clarify what "success" means for:

- project creation
- sandbox creation
- repository cloning
- import failure handling

## Scope

This document covers the current import flow for:

- creating a project from a GitHub repository
- creating the initial sandbox for that project
- cloning the selected repository into the sandbox
- representing clone failure without rolling back the project

This document does not define future repository analysis, skill installation, or
deploy automation after import.

## User Intent

When a user imports a project from GitHub, the system receives two requested outcomes:

1. Create and start a sandbox for the project
2. Clone the selected GitHub repository into that sandbox

These two outcomes are related, but they are not treated as a single all-or-nothing
product success condition.

## Success Semantics

### Project creation success

A project is considered successfully created when its sandbox is successfully created
and reaches a runnable state.

This means:

- if sandbox creation succeeds, project creation succeeds
- project success is not blocked by repository clone failure

### Import transaction success

The import transaction is considered successful only when the repository is cloned
successfully into the sandbox.

## Failure Semantics

### Sandbox creation failure

If the sandbox fails to reach a runnable state, project creation is considered failed.

### Repository clone failure

If the sandbox succeeds but repository cloning fails, the system must:

- keep the project
- keep the sandbox
- mark the import transaction as failed
- preserve the GitHub association metadata on the project

Clone failure does not roll back the project.

Examples of clone failure include:

- repository does not exist
- repository access is denied
- clone operation times out
- GitHub access token or upstream operation fails

## Current UX Requirements

For the current stage of the product:

- the user should still land in a usable project with an empty sandbox
- no dedicated import-failure modal is required yet
- the system should preserve existing code paths as much as possible

## Status Requirements

The system should represent two layers of status:

1. Project resource status
2. Import transaction status

For the current product behavior:

- project status may become `RUNNING`
- import may independently become `IMPORT_FAILED`

The intended current UI meaning is:

- `RUNNING + IMPORT FAILED`

This combination means:

- the sandbox is available
- the project exists and is usable
- the requested repository import did not complete successfully

## Retry Behavior

Repository clone should automatically retry up to 3 times, matching the current system behavior.

Requirements:

- retries are automatic
- no manual retry UX is required in this phase
- exhausting retries should leave the project intact and mark import as failed

## Persistence Requirements

The system must persist enough state to represent:

- that the project exists
- that the sandbox exists
- that the project was created from GitHub
- that the clone task was attempted
- whether the clone task eventually succeeded or failed

If clone fails, the database must still clearly reflect:

- project creation succeeded
- import did not succeed

## GitHub Metadata Requirements

If the repository later becomes unavailable or permissions change, the project should
continue to retain its GitHub association metadata.

This means clone failure or later repository access loss should not automatically clear:

- GitHub installation reference
- GitHub repository ID
- GitHub repository full name
- default branch metadata

## Non-Goals

This PRD does not define:

- a new import intent model
- a dedicated import failure modal
- post-import repository analysis
- skill installation after import
- deployment after import
- new manual retry workflows

## Implementation Notes

Current implementation should preserve this product contract:

- project creation success is anchored to sandbox success
- clone failure is visible as an import failure, not as project creation failure
- import logic may fail independently after the project already exists

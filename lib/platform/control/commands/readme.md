## lib/platform/control/commands

This directory contains write-side control-plane use cases.

Each command should:

- accept an already-authenticated intent
- validate command-specific business input
- persist the required state changes
- enqueue follow-up work when needed

Commands should not contain route handling, UI concerns, cron scheduling, or direct reconciliation loops.

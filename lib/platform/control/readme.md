## lib/platform/control

This directory contains control-plane use cases.

- `commands/`: state-changing application use cases

Modules here translate user intent into persistent state changes. They decide what records to create or update, but they do not execute long-running external effects directly.

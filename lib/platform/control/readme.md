# Control

`lib/platform/control/` contains command and query entrypoints that translate user intent into durable control-plane state.

This layer decides what should happen. It should not own long-running orchestration or provider-specific protocol details.

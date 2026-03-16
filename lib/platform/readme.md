# Platform

`lib/platform/` is the main container for Fulling's control-plane code.

The full system still includes the interaction layer in `app/`, but the platform
area itself is organized into these internal layers:

1. Control State Layer: `lib/platform/control/`
2. Persistence Layer: `lib/platform/persistence/`
3. Orchestration Layer: `lib/platform/orchestrators/`
4. Execution Layer: `lib/platform/executors/`
5. Integration Layer: `lib/platform/integrations/`

The interaction layer remains outside `lib/platform/` because it is framework-facing.

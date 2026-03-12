## lib/platform

This directory contains the platform core of Fulling.

Code here should model the system's main flow:

- intent
- state
- reconcile
- effect

Framework adapters such as Next.js pages, route handlers, Server Actions, and Server Component loaders should stay outside this directory and call into it.

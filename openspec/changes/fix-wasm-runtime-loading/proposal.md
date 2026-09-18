## Why

Published UI Grid packages automatically request WASM from an application-relative
`dist/ui-grid-wasm-web` path that exists in this repository's demo but not in a
consumer application. Consumers therefore see failed module requests and only
avoid them by registering the TypeScript pipeline as a misleading WASM-engine
workaround.

## What Changes

- Make the compiled WASM package a runtime dependency of the framework-neutral
  core package and load its bundler entry through normal package resolution.
- Preserve an explicit web-asset URL mode for CDN and unbundled deployments,
  without using application-relative demo assets as the default.
- Centralize WASM initialization and module registration in the core package so
  vanilla, Angular, React, and Solid consumers share one lifecycle.
- Keep the TypeScript implementation available while WASM loads or when loading
  fails, without issuing a failed asset request on every grid refresh.
- Add packed-consumer validation proving Angular and Vite builds emit and load
  the WASM artifact without consumer asset-copy configuration.

## Capabilities

### New Capabilities

- `wasm-runtime-loading`: Defines portable package-owned WASM initialization,
  explicit external-asset configuration, fallback behavior, and consumer-build
  compatibility.

### Modified Capabilities

- None.

## Impact

- Affects `@ornery/ui-grid-core` runtime dependencies and WASM bridge/path code.
- Affects automatic initialization in `@ornery/ui-grid-vanilla` and the React
  WASM helper; Angular and Solid inherit the corrected behavior through vanilla.
- Affects package manifests, lockfiles, release assembly, and package-consumer
  tests.
- Retains the existing TypeScript fallback and existing explicit asset-base API;
  no framework component API changes are required.

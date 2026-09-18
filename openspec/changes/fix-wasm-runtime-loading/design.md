## Context

See `proposal.md` for motivation and
`specs/wasm-runtime-loading/spec.md` for required behavior. The core currently
constructs web-target module and binary URLs from `document.baseURI`, while the
repository demo alone copies those files to `dist/ui-grid-wasm-web`. The release
assembly separately exposes a bundler-target artifact under `./wasm`, and the
source repository installs `@ornery/ui-grid-wasm` only as a development
dependency.

The vanilla controller starts WASM initialization on refresh and otherwise uses
TypeScript bridge fallbacks. React also contains a separate hard-coded loader.
The public module-registration helpers are currently no-ops, and failed
automatic initialization can be retried on later refreshes.

## Goals / Non-Goals

**Goals:**

- Make WASM work after a normal package install with Angular, React, Solid, and
  vanilla consumer builds.
- Give core one initialization state machine shared by every wrapper and grid.
- Preserve asynchronous startup, TypeScript fallback, SSR-safe imports, and the
  existing explicit asset-base use case.
- Validate the behavior against packed artifacts rather than only monorepo path
  mappings and demo asset configuration.

**Non-Goals:**

- Move DOM or string rendering into Rust.
- Change which bridge operations currently use WASM or replace TypeScript
  fallbacks.
- Remove the existing `@ornery/ui-grid/wasm` export in this change.
- Change framework component props, inputs, outputs, or rendering lifecycles.

## Decisions

### Use the WASM package's bundler entry by default

Declare `@ornery/ui-grid-wasm` as a runtime dependency of
`@ornery/ui-grid-core`. When no explicit asset base is configured, core will use
a normal dynamic package import of the bundler entry, without an import-ignore
directive. Its generated glue imports the `.wasm` file, allowing the consuming
bundler to emit and address that file according to its own asset policy.

This is preferred to copying files from `node_modules` because libraries cannot
reliably modify every consuming application's asset configuration. Embedding a
fixed public URL has the same base-path problem as the current implementation.
The import remains dynamic so server-side package evaluation and initial grid
rendering do not synchronously initialize WASM.

### Preserve web-target loading as an explicit mode

`setUiGridWasmAssetBase()` remains the opt-in for unbundled and CDN deployments.
When a non-null base is explicitly configured, core dynamically imports the
web-target JavaScript and passes the resolved binary URL to its initializer.
Clearing the base restores package-owned loading.

The default will no longer infer this mode from `document.baseURI`. Existing
callers that explicitly configure an asset base retain their behavior, while
ordinary consumers stop depending on repository layout.

### Centralize module installation and initialization state in core

Core will own a single module reference and a memoized initialization promise.
Both the package loader and external-asset loader normalize their result through
one internal module-installation path. Public preinitialized-module registration
will call that same path instead of remaining a no-op.

Successful and failed automatic attempts are memoized. Multiple grids therefore
share one attempt, and a failure cannot create a request loop on refresh. A new
explicit asset-base configuration invalidates a failed attempt, while registering
a module immediately replaces failed or pending fallback state. Already
initialized modules are not reloaded implicitly.

### Make wrappers delegate instead of owning loader paths

Vanilla retains responsibility for requesting asynchronous enablement from its
browser lifecycle, but delegates initialization to core. The React helper will
also delegate to the core API and remove its hard-coded module and binary paths.
Angular and Solid require no loader of their own because they mount the vanilla
element.

This keeps WASM readiness distinct from `registerRustWasmGridEngine()`, whose
pipeline-binding state is not an asset-loading signal. The reporter's workaround
will no longer be needed to suppress a request and will not become part of the
documented setup.

### Test installed artifacts in real consumer builds

Unit tests will cover loader selection, single-flight behavior, registration,
failure memoization, reconfiguration, and SSR-safe import. Package tests will
install packed artifacts into minimal Angular and Vite consumers, build them
without custom asset copying, and verify that a WASM artifact is emitted and no
`dist/ui-grid-wasm-web` URL remains in executable output.

The existing explicit web-asset mode will have a browser-level fixture that
serves the web module and binary from a configured base. Release-package checks
will also verify that the core manifest carries the WASM runtime dependency.

## Risks / Trade-offs

- [A consumer bundler does not support the wasm-bindgen bundler output] → Run
  packed Angular and Vite build tests and retain explicit web-target loading for
  supported exceptional deployments.
- [Dynamic package import is accidentally externalized] → Inspect packed
  consumer output and execute a browser smoke test, rather than asserting only
  that compilation succeeds.
- [Failed initialization becomes permanently sticky] → Reset only failed
  state when explicit configuration changes, and allow direct module
  registration at any time.
- [A version mismatch appears between TypeScript bindings and Rust exports] →
  pin the runtime dependency and exercise representative WASM-backed operations
  in package-consumer tests.
- [Existing CDN users lose their setup] → Preserve the asset-base API and
  web-target URL mode with dedicated compatibility tests.

## Migration Plan

1. Add the runtime dependency and refactor core initialization behind tests.
2. Delegate vanilla and React enablement to the shared lifecycle and remove
   wrapper-local hard-coded paths.
3. Build and pack the packages, then validate fresh Angular and Vite consumers
   without asset configuration.
4. Validate the explicit CDN-style path and all framework test suites.
5. Document zero-configuration default loading and the explicit external-hosting
   escape hatch.

Rollback restores the previous core loader and dependency manifests. The
TypeScript fallback remains available throughout rollout, and the existing
explicit web artifacts remain published during the change.

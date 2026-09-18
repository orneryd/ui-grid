## 1. Regression baseline and package contract

- [ ] 1.1 Add a regression test that exercises automatic initialization from a
  consumer-style document base without a `dist/ui-grid-wasm-web` asset tree and
  verify the current loader fails for the reason reported in issue #7381.
- [x] 1.2 Add `@ornery/ui-grid-wasm` as a pinned runtime dependency of
  `@ornery/ui-grid-core`, update the relevant lockfiles, and verify packed core
  metadata installs the dependency transitively.
- [ ] 1.3 Add a release-package assertion that the compatibility `./wasm` export
  remains present and verify its files resolve from a packed `@ornery/ui-grid`
  artifact.

## 2. Core WASM initialization lifecycle

- [x] 2.1 Replace default document-relative loading with a non-ignored dynamic
  import of the WASM package's bundler entry and verify a core loader test reaches
  ready state without requesting `dist/ui-grid-wasm-web`.
- [x] 2.2 Preserve explicit asset-base loading through the web-target module and
  binary initializer, and verify configure, normalize, clear, and nested-base
  cases in unit tests.
- [x] 2.3 Centralize module installation, single-flight initialization, and
  terminal failure state in core; verify concurrent calls share one attempt and
  ordinary calls after failure do not start another request.
- [x] 2.4 Implement preinitialized-module registration and failed-state recovery;
  verify registration prevents network loading and new explicit configuration
  permits recovery after failure.
- [ ] 2.5 Verify pending and failed initialization continue to execute
  representative operations through TypeScript fallbacks and that importing core
  without browser globals performs no WASM work.

## 3. Framework integration

- [x] 3.1 Update vanilla automatic enablement to use the shared core lifecycle
  without refresh-driven retry loops and verify multiple mounted grids trigger a
  single initialization attempt.
- [x] 3.2 Replace the React-specific hard-coded loader and no-op registration
  helper with delegation to core, and verify its enablement, registration, and
  SSR tests pass.
- [ ] 3.3 Remove demo-only WASM asset copying from the Angular application build
  configuration so local builds exercise package-owned loading, then verify the
  Angular demo builds under both root and nested base hrefs.
- [ ] 3.4 Run the Angular, React, Solid, and vanilla suites and verify no wrapper
  requires `registerRustWasmGridEngine({ buildPipeline })` to suppress asset
  requests.

## 4. Packed-consumer and release validation

- [ ] 4.1 Install packed artifacts into a minimal Angular consumer with no custom
  asset configuration; verify its production build emits WASM and a browser smoke
  test initializes the runtime without a `dist/ui-grid-wasm-web` request.
- [ ] 4.2 Install packed vanilla, React, and Solid artifacts into minimal Vite
  consumers; verify production builds, nested-base browser smoke tests, and SSR
  imports succeed without repository-relative asset requests.
- [ ] 4.3 Add an explicit external-host fixture that serves the web-target module
  and binary from a configured base, and verify CDN-style loading remains
  compatible.
- [ ] 4.4 Document zero-configuration bundled loading, explicit external hosting,
  TypeScript fallback behavior, and removal of the issue #7381 workaround; verify
  documented examples compile against the packed public API.
- [ ] 4.5 Run `npm run build`, `npm test`, and `openspec validate
  fix-wasm-runtime-loading --strict`; verify all builds, suites, package checks,
  and the OpenSpec change pass.

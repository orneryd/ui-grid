## Purpose

Ensure every supported UI Grid package can initialize its compiled WASM runtime
portably while retaining safe TypeScript fallback and explicit external hosting.

## ADDED Requirements

### Requirement: Package-owned default loading

The system SHALL resolve the default WASM runtime from a published package
dependency and SHALL NOT require a consuming application to copy repository demo
assets or serve an application-relative `dist/ui-grid-wasm-web` directory.

#### Scenario: Bundled consumer uses default configuration

- **WHEN** a consumer installs a supported UI Grid wrapper and builds an
  application without configuring a WASM asset base
- **THEN** the application bundle includes or emits the required WASM artifact
  and the grid initializes it from the bundle-generated location

#### Scenario: Application uses a nested base URL

- **WHEN** a bundled application is deployed below a non-root base URL
- **THEN** WASM initialization succeeds without constructing a request from the
  document base URL and a repository-relative asset path

### Requirement: Explicit external asset loading

The system SHALL allow a consumer to configure an external asset base before
initialization and SHALL load the web-target module and binary from that base
instead of the package-owned default.

#### Scenario: Consumer hosts WASM on a CDN

- **WHEN** a consumer configures an HTTPS CDN asset base before the first grid
  initializes
- **THEN** the web-target module and binary are resolved from that configured
  base

#### Scenario: Explicit configuration is cleared

- **WHEN** a consumer clears the configured external asset base before
  initialization
- **THEN** subsequent initialization uses package-owned default loading

### Requirement: Shared and idempotent initialization

The system SHALL coordinate WASM initialization through the core runtime so
that all framework wrappers and all grid instances share one initialized module
and one in-flight initialization attempt.

#### Scenario: Multiple grids start concurrently

- **WHEN** multiple grid instances request automatic initialization before the
  first request completes
- **THEN** they await the same initialization attempt and do not independently
  fetch or instantiate the runtime

#### Scenario: Framework helper enables WASM

- **WHEN** Angular, React, Solid, or vanilla integration requests WASM enablement
- **THEN** it delegates to the same core initialization lifecycle

### Requirement: Preinitialized module registration

The system SHALL accept a compatible preinitialized WASM module through its
public registration API and SHALL use that module without performing default or
external asset loading.

#### Scenario: Consumer supplies an initialized module

- **WHEN** a consumer registers a compatible WASM module before a grid refreshes
- **THEN** WASM-backed operations use the supplied module and no automatic WASM
  network request is made

### Requirement: Safe TypeScript fallback

The system SHALL keep grid rendering and interaction available through the
TypeScript implementation before initialization completes and after an
initialization failure. An automatic failure SHALL be memoized so ordinary grid
refreshes do not repeatedly request the same unavailable asset.

#### Scenario: WASM initialization is pending

- **WHEN** a grid renders while WASM initialization has not completed
- **THEN** the grid uses the TypeScript implementation and remains interactive

#### Scenario: WASM initialization fails

- **WHEN** package-owned or explicitly configured WASM initialization fails
- **THEN** the grid continues using the TypeScript implementation and subsequent
  ordinary refreshes do not start duplicate initialization attempts

#### Scenario: Consumer changes configuration after failure

- **WHEN** initialization failed and the consumer subsequently supplies a new
  explicit asset base or preinitialized module
- **THEN** the new configuration can initialize the runtime without recreating
  the application

### Requirement: Server-side import safety

The system SHALL NOT fetch, instantiate, or require browser globals merely from
importing a UI Grid package in a server-side environment.

#### Scenario: Wrapper is imported during server rendering

- **WHEN** a supported framework wrapper is evaluated without `window` or
  `document`
- **THEN** evaluation completes without attempting WASM initialization

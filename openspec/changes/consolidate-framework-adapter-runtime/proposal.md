## Why

The Angular, React, and newly merged SolidJS wrappers all mount the same vanilla
custom element and project framework-owned content through its slot bridge, but
each independently implements option wiring, slot reconciliation, context
refresh, API wrapping, and teardown. That duplication has already caused
capability drift and makes a fourth adapter unnecessarily expensive to build
and validate.

## What Changes

- Add a reusable DOM-facing framework projection runtime owned by the vanilla
  package and consumed by the Angular, React, and SolidJS wrappers.
- Standardize slot registration, structural reconciliation, projected-context
  refresh, API callback composition, benchmark coordination, and cleanup.
- Migrate the three wrappers incrementally while preserving their public APIs
  and framework-native rendering and lifecycle behavior.
- Establish adapter conformance tests and a feature-parity matrix for cells,
  headers, details, editors, SSR/hydration, virtualization, and teardown.
- Add a post-render projection synchronization signal where the current slot
  delta events cannot report a context-only update.

## Capabilities

### New Capabilities

- `framework-projection-runtime`: A reusable projection contract that keeps
  framework-rendered grid content synchronized with the vanilla renderer
  without requiring each wrapper to reimplement DOM slot orchestration.

### Modified Capabilities

- None.

## Impact

- Affects `projects/ui-grid-vanilla`, `projects/ui-grid-react`,
  `projects/ui-grid`, and `projects/ui-grid-solid`.
- Adds a browser-facing helper subpath to the vanilla package; it does not
  change the Angular, React, or SolidJS public component APIs.
- Requires cross-wrapper tests and build/package validation. No new external
  runtime dependency is expected.

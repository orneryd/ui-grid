## Context

See `proposal.md` for motivation. The three wrappers currently perform the
same orchestration around `ui-grid-element`, but render projected content with
incompatible framework primitives: Angular embedded views, React portals, and
Solid roots. The vanilla element already owns the slot naming scheme and emits
typed delta events for cells, headers, details, filters, groups, and empty
state; deltas alone do not identify every context-only update.

## Goals / Non-Goals

**Goals:**

- Centralize DOM-slot and API orchestration without changing wrapper component
  APIs.
- Make every slot kind available through one typed lifecycle contract.
- Refresh active projections after completed grid state changes while avoiding
  structural reconfiguration on ordinary data updates.
- Preserve SSR safety and each framework's ownership, error handling, and
  rendering schedule.

**Non-Goals:**

- Replace Angular templates, React portals, or Solid roots with a common
  renderer.
- Change grid-core pipeline, row identity rules, or the existing vanilla
  string-rendering path.
- Require all wrappers to expose every projected slot type in the first
  migration.

## Decisions

### Put the shared runtime in the vanilla package

Add a DOM-facing helper subpath to `@ornery/ui-grid-vanilla`, rather than a
fourth package. It depends on the concrete custom-element contract and its slot
events, is already a dependency of every wrapper, and avoids a new package,
version, and build-order concern. Its module initialization MUST not access
browser globals; SSR-sensitive wrappers will continue to load DOM behavior
only from their client lifecycle.

### Split orchestration from rendering

The runtime will manage requested slot configuration, event listeners, stable
slot records, light-DOM mount points, API registration composition, refresh
coalescing, and disposal. A framework-supplied projection driver will create,
update, and dispose the framework-owned content for a slot. This preserves
native Angular change detection, React commits, and Solid ownership rather
than attempting an abstraction over their renderers.

### Use typed slot families and a single driver shape

Represent cell, header, detail, filter, group, and empty-state slot events as
typed families. The common runtime will normalize their add/remove lifecycle;
framework drivers declare only the families they support. This lets React and
Angular first migrate their existing cell support, while Solid retains its
additional capabilities and future wrappers can opt in progressively.

### Add a post-render projection synchronization boundary

The vanilla element will expose a projection-render completion notification
after its DOM patch and framework-slot flush. The runtime will coalesce that
signal and refresh active descriptors from the current API/options state before
asking drivers to update. This handles sorting and edits that retain the same
slot names, which delta events cannot express. The signal is emitted only when
framework projection is configured, and refresh work is batched per render.

### Centralize API and benchmark coordination

The runtime will compose `onRegisterApi` callbacks and own replacement of any
underlying benchmark subscription. A framework driver supplies a "view settled"
promise: React waits for its commit, Angular for batched change detection, and
Solid for its scheduled renderer work. This yields one public API facade with
the existing API shape while keeping framework scheduling local.

## Risks / Trade-offs

- [A generic contract obscures framework bugs] → Keep drivers small, typed,
  and directly unit-tested in each wrapper; test the runtime separately.
- [Post-render refresh adds work during scroll] → Coalesce per completed render
  and refresh only active slots, which are bounded by the rendered viewport.
- [A new vanilla subpath harms SSR consumers] → Keep it side-effect-free at
  import time and load DOM operations only in client lifecycle hooks.
- [Incremental migration causes temporary divergence] → Maintain a parity
  matrix and migrate one wrapper at a time behind its existing tests.

## Migration Plan

1. Add the runtime, its package export, and vanilla-level conformance tests.
2. Migrate React cell projections and Angular template projections without
   changing their public APIs.
3. Migrate Solid cell, header, detail, and editor bridges to the driver model.
4. Add parity coverage and selectively expose additional slot families in React
   and Angular.
5. Remove superseded wrapper-local orchestration only after all callers use the
   shared runtime.

Rollback is limited to reverting an individual wrapper migration; the existing
wrapper-local bridge remains usable until that migration is complete.

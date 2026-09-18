## 1. Baseline and contract

- [ ] 1.1 Build a wrapper parity matrix for cells, headers, details, editors, filters, empty state, SSR/hydration, virtualization, benchmark completion, and teardown; verify it against the current Angular, React, and Solid suites.
- [ ] 1.2 Reproduce and resolve the Solid hydration baseline on every supported Node version; verify `npm run build:solid && npm run test:solid` passes on a clean checkout.
- [ ] 1.3 Define the typed projection-driver and slot-family interfaces; verify TypeScript rejects incompatible slot/context pairings.

## 2. Shared vanilla runtime

- [ ] 2.1 Add the side-effect-free framework-adapter subpath and public type exports to `@ornery/ui-grid-vanilla`; verify a package-consumer build can import it without defining a custom element.
- [ ] 2.2 Implement structural slot reconciliation, mount-point ownership, and listener cleanup; verify unchanged slot identities preserve mounted projections through a data-only update.
- [ ] 2.3 Add the post-render projection synchronization boundary and coalesced active-context refresh; verify sorting, pagination, filtering, and editing update retained slots without synthetic add/remove events.
- [ ] 2.4 Implement shared API registration and benchmark coordination with a driver-provided settle hook; verify both registration callbacks run and benchmark completion waits for projection rendering.
- [ ] 2.5 Add vanilla-runtime conformance tests for each slot family, virtualization removals, async cancellation, and teardown; verify the vanilla suite passes.

## 3. Wrapper migrations

- [ ] 3.1 Migrate React cell portals to the shared runtime without changing `UiGrid` props; verify React cell, state-preservation, cleanup, and benchmark tests pass.
- [ ] 3.2 Migrate Angular template-cell projection to the shared runtime without changing `app-ui-grid` inputs or outputs; verify Angular template, change-detection, SSR-skip, and cleanup tests pass.
- [ ] 3.3 Migrate Solid cell, header, detail, and editor bridges to projection drivers; verify Solid renderer ownership, editor lifecycle, context refresh, SSR, hydration, and package-consumer tests pass.
- [ ] 3.4 Remove only wrapper-local orchestration superseded by the shared runtime; verify no wrapper imports private vanilla internals or changes its public API.

## 4. Parity and release validation

- [ ] 4.1 Add cross-wrapper conformance scenarios for slot lifecycle, retained-context updates, API composition, and teardown; verify the same scenario matrix passes for Angular, React, and Solid.
- [ ] 4.2 Decide and document the rollout order for header, detail, editor, filter, group, and empty-state support in React and Angular; verify unsupported families fail predictably rather than silently rendering stale content.
- [ ] 4.3 Run `npm run test:angular`, `npm run test:react`, `npm run test:vanilla`, and `npm run test:solid`, plus package builds in dependency order; verify all CI workflows remain green.

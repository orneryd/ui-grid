# Web Package Split and Repo Separation Plan

## Goal

Create a clean package architecture where web deliverables do not inherit Angular dependencies unless they explicitly target Angular, and prepare for a future two-repo model:

- Web repo (original angular-ui/ui-grid Repo being transferred back to me):
  - `@ornery/ui-grid-core` (shared TypeScript runtime + types)
  - `@ornery/ui-grid` (Angular adapter)
  - `@ornery/ui-grid-react` (React adapter)
  - `@ornery/ui-grid-vanilla` (framework-free web component adapter)
- Current repo (Rust/WASM repo):
  - Rust crates (`ui-grid-core`, `ui-grid-wasm`, etc.)
  - Single npm package for wasm output (`@ornery/ui-grid-wasm`)

This plan is intentionally staged to reduce breakage and preserve release continuity.

## Non-Goals

- Do not force immediate full repo split in one PR.
- Do not remove TypeScript fallback paths until wasm parity is proven.
- Do not change consumer-facing Angular/React/Vanilla APIs beyond import path updates.

## Target Package Boundaries

### `@ornery/ui-grid-core` (new)

Purpose:

- Own all pure TypeScript, framework-neutral logic and models used by web adapters.

Contains:

- Models and types currently shared across adapters.
- Pipeline/viewmodel/state helpers that do not require Angular runtime.
- Bridge hooks for wasm integration (if applicable in TS layer).

Must NOT contain:

- Angular decorators, components, DI, or Angular-only runtime APIs.
- React-specific JSX/components/hooks.
- Web-component custom element registration.

Peer dependencies:

- None preferred.
- If unavoidable, only generic runtime peers with strict justification.

### `@ornery/ui-grid` (Angular adapter)

Purpose:

- Angular-specific wrapper and integration over `@ornery/ui-grid-core`.

Depends on:

- `@ornery/ui-grid-core`.

Peer dependencies:

- Angular packages (`@angular/core`, etc.) and any Angular runtime peers.

### `@ornery/ui-grid-react` (React adapter)

Purpose:

- React-specific wrapper over `@ornery/ui-grid-core`.

Depends on:

- `@ornery/ui-grid-core`.

Peer dependencies:

- `react`, `react-dom` only.

Must NOT peer-depend on:

- `@ornery/ui-grid` (Angular package).

### `@ornery/ui-grid-vanilla` (web component adapter)

Purpose:

- Framework-free custom element package consuming `@ornery/ui-grid-core`.
- Long-term source of truth for the DOM/web-component implementation that Angular and React wrappers adapt to.

Depends on:

- `@ornery/ui-grid-core`.

Peer dependencies:

- None preferred.

Must NOT depend on:

- Angular runtime.

Wrapper direction:

- React and Angular should eventually become adapter layers over the standalone custom element plus `@ornery/ui-grid-core`.
- Framework wrappers should only handle property mapping, lifecycle integration, and framework-specific template conversion.
- The custom element should own DOM behavior, keyboard interaction, accessibility, and event dispatch semantics.

## Execution Order

## Phase 1: Inventory and Dependency Guardrails

1. Catalog current exports and ownership:

- Map each file/function under existing web packages as one of:
  - Core-shared
  - Angular-only
  - React-only
  - Vanilla-only
- Produce a migration matrix in this doc (or companion checklist).

2. Add CI guard checks:

- Fail if `projects/ui-grid-react/package.json` contains `@angular/*` peers.
- Fail if `projects/ui-grid-vanilla/package.json` contains `@angular/*` peers.
- Fail if React/Vanilla source imports from Angular package entrypoints.

Exit criteria:

- Guardrails are active and prevent reintroduction of Angular coupling.

## Phase 2: Create `@ornery/ui-grid-core` Package in Current Repo

1. Scaffold new package path:

- `projects/ui-grid-core/` with independent `package.json`, tsconfig, build/test scripts.

2. Move/copy shared TS logic into core package:

- Start with types/models/utilities and pure pipeline helpers.
- Re-export stable public APIs from core barrel.

3. Keep adapter shims stable:

- Angular/React/Vanilla packages can re-export from old paths temporarily.
- Add deprecation notes where needed.

4. Add contract tests:

- Ensure core behavior parity with pre-move snapshots.

Exit criteria:

- `@ornery/ui-grid-core` builds independently.
- No framework imports inside core package.

## Phase 3: Rewire Web Adapters to Consume Core

1. Angular package:

- Replace internal imports to use `@ornery/ui-grid-core`.
- Keep Angular-specific code in Angular package only.

2. React package:

- Replace imports from `@ornery/ui-grid` with `@ornery/ui-grid-core` where runtime/type access is needed.
- Ensure peer deps are only React peers.

3. Vanilla package:

- Replace imports from Angular package with core package.
- Replace the Angular-backed element definition with a standalone custom element implementation in TypeScript.
- Keep custom element behavior framework-neutral.
- Make the custom element the canonical DOM implementation for all web-facing adapters.

4. Verify lockfiles/package manifests:

- React and Vanilla lockfiles must not pull Angular via peers from package manifests.

Exit criteria:

- All three adapters build/test using core.
- React and Vanilla published metadata show no Angular peers.

## Phase 3A: Standalone Custom Element Extraction

1. Build a framework-neutral controller:

- Extract state, commands, event raising, and pipeline orchestration from the React implementation into a reusable TypeScript controller.
- Keep controller inputs/outputs aligned with `GridOptions`, `UiGridApi`, and current event contracts.

2. Implement `@ornery/ui-grid-vanilla` as a real custom element:

- Own custom element registration in the vanilla package.
- Render directly from the controller using DOM APIs, not Angular runtime.
- Preserve shadow DOM, keyboard editing, grouping, sorting, filtering, pinning, pagination, virtualization, tree view, expandable rows, CSV export, benchmark hooks, and wasm engine registration.

3. Migrate wrappers to adapters:

- React wrapper becomes prop/event/template bridge over the controller and/or custom element.
- Angular wrapper becomes Angular input/output/template bridge over the same controller and/or custom element.
- Framework-only responsibilities stay in wrappers: React render props, Angular `TemplateRef`, forms integration, and framework-specific change detection.

Exit criteria:

- `@ornery/ui-grid-vanilla` registers and owns the custom element with no Angular imports.
- Existing feature coverage is preserved against parity tests.
- Angular and React wrappers no longer own the canonical DOM behavior.

## Phase 4: CI/CD and Independent Release Triggers

Implement per-package GitHub Actions workflows with path-based triggers.

Required workflows:

- Core publish workflow:
  - Trigger paths: `projects/ui-grid-core/**`
  - Also runs impacted adapter integration tests.
- Angular publish workflow:
  - Trigger paths: `projects/ui-grid/**`
- React publish workflow:
  - Trigger paths: `projects/ui-grid-react/**`
- Vanilla publish workflow:
  - Trigger paths: `projects/ui-grid-vanilla/**`
  - Publishes the standalone custom element package independently.

Cross-package release rules:

- If core changes public API, publish core first, then publish dependent adapters.
- Use changesets (or equivalent) to coordinate version bumps and changelogs.

Exit criteria:

- Each package can publish independently via its own workflow trigger.
- Monorepo CI still validates full integration before release.

## Phase 5: Prepare Two-Repo Architecture

Target split:

- Future web repo: all `projects/ui-grid*` web packages.
- Current repo: Rust crates and wasm npm output.

Preparation tasks:

1. Define shared version compatibility policy:

- Semver matrix between `@ornery/ui-grid-core` (web) and `@ornery/ui-grid-wasm`.

2. Replace local cross-package assumptions:

- No direct relative imports between repo domains.
- Consume published package artifacts in integration tests.

3. Add migration-safe interfaces:

- Keep wasm bridge contract stable and documented.

4. Add repository transition docs:

- Contribution guide updates for where to file issues/PRs.
- Release runbooks split by repo.

Exit criteria:

- Web packages can be moved with minimal path rewrite.
- Rust/wasm repo can publish independently without web package build context.

## Phase 6: Execute Repo Transfer and Extraction

1. Move web packages into the restored ui-grid web repo.
2. Stand up equivalent workflows in web repo.
3. Keep current repo focused on:

- Rust crates
- wasm build
- `@ornery/ui-grid-wasm` npm publishing

4. Add compatibility CI:

- In web repo, test against latest released wasm package.
- In wasm repo, run consumer smoke tests using latest web-core contracts.

Exit criteria:

- Both repos release independently.
- Consumers can adopt web packages and wasm package without hidden coupling.

## Dependency Policy (Post-Refactor)

Hard rules:

- React package peers: `react`, `react-dom` only.
- Vanilla package peers: none.
- Angular peers only in Angular package.
- Core package must remain framework-neutral.

Enforcement:

- Add CI script to parse package manifests and assert peer dependency allowlists.
- Add import-lint rules preventing forbidden cross-package imports.

## Risk Register and Mitigations

1. Risk: hidden Angular runtime usage in shared helpers.

- Mitigation: static import scan + move-only-after-tests discipline.

2. Risk: API churn during package extraction.

- Mitigation: adapter compatibility shims and deprecation window.

3. Risk: release ordering mistakes after split.

- Mitigation: changeset preflight + release workflow dependency checks.

4. Risk: wasm/web contract drift across repos.

- Mitigation: shared contract tests using published artifacts in CI.

## Verification Checklist

- Core package builds and tests independently.
- React package has zero Angular peers in manifest.
- Vanilla package has zero Angular peers in manifest.
- Angular package contains all Angular peers.
- All adapters consume core package APIs.
- Per-package workflows trigger only on relevant paths.
- Two-repo dry run succeeds using published artifacts only.

## Suggested Immediate Next PR Sequence

1. PR 1:

- Add `@ornery/ui-grid-core` package scaffold.
- Add dependency guardrails in CI.

2. PR 2:

- Move shared types/models/utilities into core.
- Rewire imports in React and Vanilla first.

3. PR 3:

- Rewire Angular to core and finalize package manifest cleanup.
- Add per-package publish workflows.

4. PR 4:

- Add repo split readiness checks and transfer runbooks.

## Ownership Notes

Until repository transfer completes:

- Keep all packages buildable in this monorepo.
- Treat web/core interfaces as if already external to avoid tight coupling.

After transfer:

- Web repo owns adapter and core package releases.
- Current repo owns Rust crate and wasm package releases.

# uiGrid to ui-grid Web Repository Migration

## Objective

Split the current `uiGrid` monorepo into two independently buildable and releasable repositories:

- `orneryd/ui-grid` owns all web deliverables: framework-neutral TypeScript core, Angular, React, Vanilla/Web Component, web demo/docs, npm releases, and web GitHub Actions.
- `orneryd/uiGrid` owns all Rust crates, native adapters, the Rust/WASM implementation, crates.io releases, and Rust GitHub Actions.

This is a repository migration, not a product-code rewrite. Copy the web implementation unchanged. Configuration, scripts, workflows, documentation, and repository metadata may change only as needed to build the existing tagged Rust crate from crates.io and move the existing release process.

The web build must download the latest selected tagged `ui-grid-wasm` crate from crates.io and compile it into the same generated locations currently used by the web code. Do not copy Rust source from `uiGrid`, add a new WASM npm package, or change web runtime imports during this exercise.

## Starting Point

- [x] Preserve the AngularJS repository state on remote branch `angular-1-archive` at `8207e7d4`.
- [x] Delete the legacy tree from local `main` in commit `11525f5f`.
- [ ] Do not push the empty `main` cutover until the imported web tree builds and tests locally.
- [ ] Record the source web snapshot from `../uiGrid` used for migration. Initial candidate: `feb0c05`.
- [x] Verify the latest matching tagged Rust release: repository tag `v1.0.8` and crates.io packages `ui-grid-contracts`, `ui-grid-virtualization`, `ui-grid-core`, and `ui-grid-wasm` at `1.0.8`.
- [ ] Pin `UI_GRID_WASM_VERSION=1.0.8` in one build configuration location; do not resolve an unbounded latest version during CI.
- [x] Select `v5.0.0` as the first web release in this repository. Legacy tags occupy majors 1 through 4, ending at `v4.12.7`; major 5 is unused.
- [ ] Tag the last combined `uiGrid` commit before removing web code, for example `pre-web-repo-split`.

## Migration Constraints

- [ ] Make no behavioral or public API changes under `src/**` or `projects/**` as part of the split.
- [ ] Preserve all four existing npm package identities and destinations:
  - `@ornery/ui-grid`
  - `@ornery/ui-grid-core`
  - `@ornery/ui-grid-react`
  - `@ornery/ui-grid-vanilla`
- [ ] Preserve `publishConfig.registry=https://registry.npmjs.org/` and `publishConfig.access=public`.
- [ ] Preserve current npm release credentials, environments, tag semantics, package order, and publish commands when moving workflows.
- [ ] Publish all four migrated web packages as `5.0.0` from repository tag `v5.0.0`.
- [ ] Keep the web suite on one synchronized version and update internal `@ornery/ui-grid-*` dependencies to `5.0.0` during release preparation.
- [ ] Do not introduce `@ornery/ui-grid-wasm` or any other new publish destination.
- [ ] Do not publish, modify, or retag Rust crates during this exercise.
- [ ] Do not copy Rust source or workspace manifests into this repository.
- [ ] Keep generated WASM files untracked and reproducible from crates.io.

## Phase 1: Lock the Existing Release Inputs

- [x] Verify the complete web-relevant crate set is available from crates.io at `1.0.8`: `ui-grid-contracts`, `ui-grid-virtualization`, `ui-grid-core`, and `ui-grid-wasm`.
- [ ] Download only the direct `ui-grid-wasm 1.0.8` build input; let Cargo resolve its tagged transitive crate dependencies from crates.io.
- [ ] Verify the downloaded crate checksum against the crates.io index and record it in the migration PR.
- [ ] Confirm tag `v1.0.8` is the intended compatibility baseline for all web packages.
- [ ] Confirm the existing published web package versions are `1.0.8` before moving release ownership.
- [x] Record `5.0.0` / `v5.0.0` as the first migrated web version and tag; do not republish immutable npm version `1.0.8`.

**Gate:** Do not remove web files or workflows from `uiGrid` until this repository builds the unchanged web source from the crates.io artifact.

## Phase 2: Import the Web Tree

Copy from the recorded `uiGrid` commit, not from ignored/generated working-tree content.

### Copy

- [ ] Root web configuration: `.editorconfig`, `.gitignore`, `.prettierrc`, `angular.json`, `package.json`, `package-lock.json`, and `tsconfig*.json`.
- [ ] All web package source under `projects/ui-grid`, `projects/ui-grid-core`, `projects/ui-grid-react`, and `projects/ui-grid-vanilla`.
- [ ] Angular demo/documentation application source under `src/**`.
- [ ] Static web assets under `public/**`.
- [ ] Web build/release scripts under `scripts/**` after removing Rust build assumptions.
- [ ] Web hooks and relevant editor configuration after reviewing machine-specific entries.
- [ ] Web-facing documentation and screenshots.
- [ ] `LICENSE.md`, then rewrite `README.md`, `CHANGELOG.md`, and contribution/agent guidance for this repository.

### Do Not Copy

- [ ] `Cargo.toml`, `Cargo.lock`, or `rust-toolchain.toml`.
- [ ] `crates/**`, `target/**`, generated WASM output, `dist/**`, `.angular/**`, or `node_modules/**`.
- [ ] Rust/native-only plans, examples, or documentation such as egui and native adapter material.
- [ ] `.github/workflows/rust.yml` or `.github/workflows/publish-rust.yml`.
- [ ] Secrets, local MCP configuration, or machine-specific editor settings.

### Review Individually

- [ ] Keep web WASM usage documentation, but rewrite repository-development instructions to explain crates.io hydration and the pinned crate version.
- [ ] Split mixed web/Rust feature-parity documentation between the two repositories and cross-link the results.
- [ ] Review `.githooks/pre-commit` and remove Cargo checks.
- [ ] Review `.vscode/**`; include only portable web tasks/extensions/settings.
- [ ] Preserve attribution and relevant changelog entries while clearly marking the new web-rewrite release line.

## Phase 3: Replace Local Workspace Coupling

- [ ] Add one migration/build helper that downloads the exact `ui-grid-wasm 1.0.8` `.crate` artifact from crates.io into a temporary ignored directory.
- [ ] Verify the downloaded crate checksum before extraction.
- [ ] Build the extracted crate with `wasm-pack` for both current targets.
- [ ] Write generated output to the existing `dist/ui-grid-wasm` and `dist/ui-grid-wasm-web` paths so runtime source and Angular asset configuration remain unchanged.
- [ ] Update existing `build:rust:wasm` and `build:rust:web` scripts to call the crates.io hydration helper instead of `crates/ui-grid-wasm`.
- [ ] Remove `test:rust`; Rust source tests remain owned by `uiGrid`.
- [ ] Keep all TypeScript, Angular, React, Vanilla, and WASM bridge source unchanged.
- [ ] Keep current web package manifests and package names unchanged except for repository metadata that must point to `orneryd/ui-grid`.
- [ ] Ensure temporary crate source and generated WASM outputs remain ignored and are never included accidentally in web npm tarballs.

**Decoupling gate:** From a clean clone with no sibling `uiGrid` checkout, all existing web build and test commands pass using only Node/npm, the pinned Rust toolchain/`wasm-pack`, and `ui-grid-wasm 1.0.8` downloaded from crates.io.

## Phase 4: Migrate Web GitHub Actions

Copy and adapt these workflows:

- [ ] `ci.yml`
- [ ] `ci-react.yml`
- [ ] `ci-vanilla.yml`
- [ ] `pages.yml`
- [ ] `publish-core.yml`
- [ ] `publish-react.yml`
- [ ] `publish-vanilla.yml`
- [ ] `publish.yml`

For every migrated workflow:

- [ ] Preserve Rust toolchain `1.95.0` and `wasm-pack` installation where the existing web build requires generated WASM.
- [ ] Replace local `crates/ui-grid-wasm` builds with the pinned crates.io hydration helper.
- [ ] Cache the crates.io download/toolchain safely using the crate version and checksum in the cache key.
- [ ] Install web dependencies with the existing `npm ci --legacy-peer-deps` behavior unless a separately scoped change proves it can be removed.
- [ ] Update path filters for the web-only tree.
- [ ] Update repository names, badges, artifact names, environments, and Pages URLs from `uiGrid` to `ui-grid`.
- [ ] Change the Pages base/deploy path from `/uiGrid/` to `/ui-grid/` where required.
- [ ] Preserve least-privilege workflow permissions, current `NPM_TOKEN` usage, registry URL, public access, version inputs, and publish order.
- [ ] Add a guard that rejects checked-in Cargo workspaces/Rust source and local cross-repo paths while allowing the isolated crates.io hydration step.
- [ ] Confirm `publish.yml` still publishes Core first, then the same dependent web packages to their current npm names.
- [ ] Validate that a `v5.0.0` tag resolves release version `5.0.0` and publishes every web package at that version.

## Phase 5: Validate the Web Repository

- [ ] `npm ci`
- [ ] Build and test `projects/ui-grid-core`.
- [ ] Build and test `projects/ui-grid-vanilla`.
- [ ] Build and test `projects/ui-grid-react`.
- [ ] Build and test the Angular package and demo application.
- [ ] Build the production Pages artifact with `/ui-grid/` base paths.
- [ ] Exercise WASM initialization in a browser and verify the `.wasm` request succeeds.
- [ ] Exercise the TypeScript fallback path.
- [ ] Compare representative behavior and built package exports with `v1.0.8`; no product-code diff is allowed.
- [ ] Run `npm pack --dry-run` for every publishable web package.
- [ ] Inspect packed manifests and compare package names, registry, access, exports, and dependencies with their current `uiGrid` equivalents.
- [ ] Scan tracked files and CI for forbidden Rust ownership:

  ```sh
  test -z "$(git ls-files 'Cargo.toml' 'Cargo.lock' 'rust-toolchain.toml' 'crates/**')"
  ! git grep -n -E 'crates/ui-grid-wasm|\.\./uiGrid' -- package.json projects scripts .github
  ```

- [ ] Test a clean clone outside the sibling-repository layout so hidden `../uiGrid` dependencies cannot pass accidentally.

## Phase 6: Cut Over `ui-grid`

- [ ] Review the complete replacement diff from archive commit `8207e7d4` to the migrated tree.
- [ ] Verify `src/**` and `projects/**` match the recorded `uiGrid` source snapshot byte-for-byte, excluding approved repository metadata only.
- [ ] Keep the migration as a small sequence of comprehensible commits: legacy deletion, unchanged web import, build/workflow migration, and repository docs adjustments.
- [ ] Push a migration branch first and open a PR against `main` if branch protection permits.
- [ ] Confirm required GitHub repository secrets/environments for npm and Pages exist before merging.
- [ ] Merge or push the validated tree to `main` without rewriting the retained AngularJS history.
- [ ] Publish web prerelease packages and run consumer smoke tests.
- [ ] Deploy GitHub Pages and verify routes/assets under the new repository path.
- [ ] Publish the first stable web release only after prerelease validation.

## Phase 7: Remove Web Ownership from `uiGrid`

After the web release is working from this repository:

- [ ] Remove `projects/**`, Angular/web `src/**`, web-only `public/**`, and web-only scripts from `uiGrid`.
- [ ] Remove web CI, Pages, and web npm publish workflows from `uiGrid`.
- [ ] Keep Rust crate source, tests, crates.io publishing, and Rust/native workflows in `uiGrid`.
- [ ] Rewrite `uiGrid` documentation around Rust crates, native adapters, crates.io releases, and links to `orneryd/ui-grid` for web consumers.
- [ ] Add reciprocal repository links and issue-routing guidance in both repositories.
- [ ] Verify Rust crate publication still works with all web source removed.

## Release Order

For the initial split:

1. Select the already-published tagged crates.io version (`ui-grid-wasm 1.0.8` initially).
2. Build and validate the unchanged web source against that crate in `ui-grid`.
3. Create repository tag `v5.0.0` for the first migrated web release.
4. Publish `@ornery/ui-grid-core@5.0.0` to its existing npm destination.
5. Publish `@ornery/ui-grid@5.0.0`, `@ornery/ui-grid-vanilla@5.0.0`, and `@ornery/ui-grid-react@5.0.0` to their existing npm destinations after Core is available.
6. Deploy the web documentation/demo.

Future Rust releases remain independent in `uiGrid`. A web release adopts a newer crate only through an explicit pinned-version configuration update and full compatibility validation.

## Rollback

- `angular-1-archive` remains the recovery point for the legacy AngularJS tree.
- The pre-split tag in `uiGrid` remains the recovery point for the combined rewrite repository.
- Do not delete either recovery reference after the first successful release.
- If web cutover fails, revert the migration commits on `ui-grid`; do not force-push or alter the archive branch.

## Completion Criteria

- [ ] `ui-grid` contains no checked-in Rust source or Cargo workspace.
- [ ] `ui-grid` builds unchanged web source from the pinned tagged crate downloaded from crates.io.
- [ ] `ui-grid` publishes the same four web package names to the same npm registry with the same access settings.
- [ ] The first migrated web release is `v5.0.0`, with all four web packages published at `5.0.0` and Rust/WASM crates independently pinned at `1.0.8`.
- [ ] `uiGrid` builds and publishes all Rust crates without web source.
- [ ] Both repositories pass clean-clone CI independently.
- [ ] Crate compatibility, checksum verification, and release ordering are documented and enforced.
- [ ] Angular, React, Vanilla, and Core npm consumers retain their intended public APIs.
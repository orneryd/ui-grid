## Purpose

Provide one reusable projection lifecycle for framework adapters so projected
grid content remains correct, efficient, and disposable across UI frameworks.

## ADDED Requirements

### Requirement: Structural slot reconciliation

The system SHALL reconcile the framework-declared slot configuration with the
vanilla grid element and SHALL only request a slot-layout re-render when that
configuration changes structurally. It SHALL preserve mounted projected content
when the slot identity remains unchanged.

#### Scenario: Data-only update retains a projected cell

- **WHEN** a wrapper replaces data while a visible projected cell keeps the
  same slot identity
- **THEN** the projected cell remains mounted and receives its current context

#### Scenario: Renderer column is removed

- **WHEN** a wrapper removes a column from its declared projected slot set
- **THEN** the system disposes that column's projected content and restores the
  vanilla rendering path for subsequent renders

### Requirement: Projection lifecycle delivery

The system SHALL deliver added slots to the framework renderer, deliver removed
slots before their light-DOM mount points are discarded, and retain a stable
identity for an active slot until the vanilla element removes it.

#### Scenario: A virtualized row leaves the viewport

- **WHEN** the vanilla grid removes a projected row slot during virtualization
- **THEN** the framework renderer receives one removal for that slot and can
  dispose its framework-owned view or root

### Requirement: Current projected contexts

The system SHALL refresh active projected contexts after a completed grid
render when sorting, filtering, grouping, pagination, editing, data
replacement, or virtualization changes the row, value, index, or slot state
represented by active projected content.

#### Scenario: Sorting preserves slot names

- **WHEN** sorting changes which visible row occupies an existing projected
  cell slot without emitting a slot add/remove delta
- **THEN** the projected cell receives the row, value, and row index from the
  completed sort render

#### Scenario: Editing updates an expanded detail

- **WHEN** an edit commits for a row with an active projected detail
- **THEN** the detail receives the row's committed values without requiring an
  unrelated grid update

### Requirement: API callback and benchmark compatibility

The system SHALL compose wrapper-owned and consumer-provided API registration
callbacks without replacing either callback. It SHALL preserve the public grid
API shape and report benchmark completion only after required projected
rendering has settled.

#### Scenario: Both registration callbacks are present

- **WHEN** a wrapper callback and `options.onRegisterApi` are both supplied
- **THEN** both receive a compatible API for the same registration

#### Scenario: Benchmark includes projected rendering

- **WHEN** a benchmark runs on a grid with active framework projections
- **THEN** its completion result is delivered after the framework has completed
  the rendering work triggered by that benchmark iteration

### Requirement: Deterministic teardown

The system SHALL detach element and API listeners, dispose all active projected
content, remove framework-owned light-DOM mount points, and ignore pending
projection work after wrapper or grid teardown.

#### Scenario: Unmount during deferred mount

- **WHEN** the wrapper unmounts before deferred element or editor projection
  work runs
- **THEN** no projected content is mounted after teardown and no listener or
  framework root remains retained

# Tree View

Display hierarchical data with collapsible parent/child rows.

## Data Shape

Nest child rows under a configurable property (default: `children`):

```typescript
const treeData = [
  {
    name: 'Engineering',
    headcount: 42,
    children: [
      { name: 'Frontend', headcount: 18 },
      { name: 'Backend', headcount: 24 },
    ],
  },
];

const gridOptions: GridOptions = {
  id: 'org-tree',
  data: treeData,
  enableTreeView: true,
  treeChildrenField: 'children',
  treeIndent: 20,
  columnDefs: [
    { name: 'name' },
    { name: 'headcount', type: 'number' },
  ],
};
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableTreeView` | `boolean` | `false` | Enable tree mode |
| `treeChildrenField` | `string` | `'children'` | Property name for child array |
| `treeIndent` | `number` | `10` | Pixels per indent level |
| `showTreeExpandNoChildren` | `boolean` | `true` | Show toggle for childless rows |
| `treeRowHeaderAlwaysVisible` | `boolean` | `false` | Always show expand column |

## Filtering

When a filter is active, child matches bubble up — parent rows are shown even when they don't match the filter, as long as at least one child does.

## API

| Method | Description |
|--------|-------------|
| `gridApi.treeBase.toggleRowTreeState(row)` | Toggle node expansion |
| `gridApi.treeBase.expandRow(row)` | Expand a node |
| `gridApi.treeBase.collapseRow(row)` | Collapse a node |
| `gridApi.treeBase.expandAllRows()` | Expand all nodes |
| `gridApi.treeBase.collapseAllRows()` | Collapse all nodes |
| `gridApi.treeBase.getRowChildren(row)` | Get child GridRow objects |
| `gridApi.treeView.getTreeView()` | Get current expansion state map |
| `gridApi.treeView.setTreeView(state)` | Bulk set expansion state |

## Tree View vs Grouping

| | Tree View | Row Grouping |
|-|-----------|-------------|
| Data source | Pre-structured with `children` array | Flat data — groups created dynamically |
| Nesting | Your data defines the hierarchy | Grid creates groups from column values |
| Mutual exclusivity | Disables grouping when active | Disables tree view when active |

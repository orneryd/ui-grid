# Cell Editing

Inline spreadsheet-style editing with full keyboard navigation.

## Enable Editing

Set `enableCellEdit` or `enableCellEditOnFocus` at the grid or column level:

```typescript
const gridOptions: GridOptions = {
  enableCellEditOnFocus: true, // grid-level: edit on cell focus
  columnDefs: [
    { name: 'name', enableCellEdit: true },    // this column is editable
    { name: 'revenue', enableCellEdit: false }, // this column is read-only
  ],
};
```

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `F2` or `Enter` | Begin editing focused cell |
| Any printable key | Begin editing and replace value |
| `Backspace` / `Delete` | Clear value and begin editing |
| `Tab` | Commit and move to next editable cell |
| `Shift + Tab` | Commit and move to previous editable cell |
| `Enter` | Commit and move down |
| `Shift + Enter` | Commit and move up |
| `Escape` | Cancel edit, restore original value |

## Conditional Editing

Use `cellEditableCondition` to allow/deny editing per row:

```typescript
{
  name: 'status',
  enableCellEdit: true,
  cellEditableCondition: (ctx) => ctx.row['status'] !== 'Enterprise',
}
```

## Edit Model Field

When the column name differs from the data property you want to write to, set `editModelField`:

```typescript
{
  name: 'owner',
  field: 'account.owner',
  editModelField: 'account.owner', // writes edited value to this path
  enableCellEdit: true,
}
```

## API

| Method / Event | Description |
|----------------|-------------|
| `gridApi.edit.beginCellEdit(row, colName)` | Start editing programmatically |
| `gridApi.edit.endCellEdit()` | Commit the current edit |
| `gridApi.edit.cancelCellEdit()` | Cancel without committing |
| `gridApi.edit.getEditingCell()` | Returns the current editing position or null |
| `gridApi.edit.on.beginCellEdit` | `(row, col, event) => void` |
| `gridApi.edit.on.afterCellEdit` | `(row, col, newVal, oldVal) => void` |
| `gridApi.edit.on.cancelCellEdit` | `(row, col) => void` |

## Type-Aware Editing

The editor input type adapts to the column's `type`:
- `'number'` → `<input type="number">`
- `'date'` → `<input type="date">`
- default → `<input type="text">`

Value parsing is automatic: numeric strings become `Number`, `'true'`/`'false'` become booleans, and date strings remain as-is.

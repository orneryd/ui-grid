import * as wasm from '../../../../dist/ui-grid-wasm/ui_grid_wasm.js';

const payload = JSON.parse(process.argv[2] ?? '{}');

async function main() {
  switch (payload.command) {
    case 'isGridTreeEnabled':
      return wasm.is_grid_tree_enabled_js(payload.input);
    case 'isGridGroupingEnabled':
      return wasm.is_grid_grouping_enabled_js(payload.input);
    case 'canGridExpandRows':
      return wasm.can_grid_expand_rows_js(payload.input);
    case 'isGridPaginationEnabled':
      return wasm.is_grid_pagination_enabled_js(payload.input);
    case 'shouldShowGridPaginationControls':
      return wasm.should_show_grid_pagination_controls_js(payload.input);
    case 'isGridInfiniteScrollEnabled':
      return wasm.is_grid_infinite_scroll_enabled_js(payload.input);
    case 'isGridSortingEnabled':
      return wasm.is_grid_sorting_enabled_js(payload.input);
    case 'isGridFilteringEnabled':
      return wasm.is_grid_filtering_enabled_js(payload.input);
    case 'canGridMoveColumns':
      return wasm.can_grid_move_columns_js(payload.input);
    case 'isGridPrimaryColumn':
      return wasm.is_grid_primary_column_js(payload.input);
    case 'isGridColumnSortable':
      return wasm.is_grid_column_sortable_js(payload.input);
    case 'isGridColumnFilterable':
      return wasm.is_grid_column_filterable_js(payload.input);
    case 'shouldShowGridTreeToggle':
      return wasm.should_show_grid_tree_toggle_js(payload.input);
    case 'shouldShowGridExpandToggle':
      return wasm.should_show_grid_expand_toggle_js(payload.input);
    case 'gridSortButtonLabel':
      return wasm.grid_sort_button_label_js(payload.input);
    case 'gridSortAriaSort':
      return wasm.grid_sort_aria_sort_js(payload.input);
    case 'gridGroupingButtonLabel':
      return wasm.grid_grouping_button_label_js(payload.input);
    case 'gridFilterPlaceholder':
      return wasm.grid_filter_placeholder_js(payload.input);
    case 'gridGroupDisclosureLabel':
      return wasm.grid_group_disclosure_label_js(payload.input);
    case 'gridEditorInputType':
      return wasm.grid_editor_input_type_js(payload.input);
    case 'gridColumnWidth':
      return wasm.grid_column_width_js(payload.input);
    case 'gridCellIndent':
      return wasm.grid_cell_indent_js(payload.input);
    case 'gridTreeToggleLabel':
      return wasm.grid_tree_toggle_label_js(payload.input);
    case 'gridExpandToggleLabel':
      return wasm.grid_expand_toggle_label_js(payload.input);
    case 'isGridColumnGrouped':
      return wasm.is_grid_column_grouped_js(payload.input);
    case 'isGridTreeRowExpanded':
      return wasm.is_grid_tree_row_expanded_js(payload.input);
    case 'gridTreeToggleLabelForRow':
      return wasm.grid_tree_toggle_label_for_row_js(payload.input);
    case 'gridExpandToggleLabelForRow':
      return wasm.grid_expand_toggle_label_for_row_js(payload.input);
    default:
      throw new Error(`Unknown wasm viewmodel command: ${payload.command}`);
  }
}

const result = await main();
process.stdout.write(JSON.stringify(result));

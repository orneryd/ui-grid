import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridApi, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';
import { createSmallDemoData } from '../../shared/demo-data';

@Component({
  selector: 'app-docs-exporter',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Exporter (CSV / PDF / Excel)</h1>
      <p class="docs-lead">
        Full parity with <code>ui.grid.exporter</code>: every option from the old module maps
        through to <code>buildGridCsv</code> / <code>buildGridPdfDocDefinition</code> /
        <code>buildGridExcelSheetData</code>. CSV is built-in; PDF uses
        <code>window.pdfMake</code> when present; Excel uses <code>window.ExcelBuilder</code>. When
        the optional library is missing, the method returns the raw structure so you can render it
        however you like.
      </p>

      <h2>Live Example</h2>
      <p>Buttons below call the matching <code>gridApi.exporter</code> method:</p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>
      <p>
        <button type="button" (click)="exportCsv('all')">CSV — all rows</button>
        <button type="button" (click)="exportCsv('visible')">CSV — visible</button>
        <button type="button" (click)="exportCsv('selected')">CSV — selected</button>
        <button type="button" (click)="exportPdf('all')">PDF docDefinition</button>
        <button type="button" (click)="exportExcel('all')">Excel sheet data</button>
      </p>

      <h2>Public API</h2>
      <table class="docs-table">
        <thead><tr><th>Method</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>exporter.csvExport(rowType?, colType?)</code></td><td>Build + download a CSV. <code>rowType</code>: <code>'all'</code> / <code>'visible'</code> / <code>'selected'</code>. <code>colType</code>: <code>'all'</code> / <code>'visible'</code>.</td></tr>
          <tr><td><code>exporter.buildCsv(rowType?, colType?)</code></td><td>Return the CSV string without triggering a download</td></tr>
          <tr><td><code>exporter.pdfExport(rowType?, colType?)</code></td><td>Call <code>pdfMake.createPdf(...).open()</code> / <code>.download()</code> if pdfMake is on <code>window</code>; otherwise returns the doc definition</td></tr>
          <tr><td><code>exporter.buildPdfDocDefinition(rowType?, colType?)</code></td><td>Returns a pdfMake-ready document definition</td></tr>
          <tr><td><code>exporter.excelExport(rowType?, colType?)</code></td><td>Trigger <code>window.ExcelBuilder</code> to download an xlsx; returns the sheet data either way</td></tr>
          <tr><td><code>exporter.buildExcelSheetData(rowType?, colType?)</code></td><td>Returns the 2D sheet data with native numeric / boolean types preserved</td></tr>
          <tr><td><code>exporter.getMenuItems()</code></td><td>Grid-menu entries ("Export all / visible / selected as CSV / PDF / Excel")</td></tr>
          <tr><td><code>exporter.getOptions()</code> / <code>setOptions(options)</code></td><td>Read / override the current exporter option bundle</td></tr>
        </tbody>
      </table>

      <h2>CSV Options</h2>
      <table class="docs-table">
        <thead><tr><th>Option</th><th>Default</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>exporterCsvColumnSeparator</code></td><td><code>','</code></td><td>Separator between fields</td></tr>
          <tr><td><code>exporterCsvFilename</code></td><td><code>gridId + '.csv'</code></td><td>Download filename. String or <code>(rowType, colType) =&gt; string</code>.</td></tr>
          <tr><td><code>exporterHeaderFilterUseName</code></td><td>false</td><td>Use column <code>name</code> instead of <code>displayName</code> in headers</td></tr>
          <tr><td><code>exporterHeaderFilter</code></td><td>—</td><td><code>(displayName, column) =&gt; string</code> — transform headers</td></tr>
          <tr><td><code>exporterShowHeader</code></td><td>true</td><td>Include the header row</td></tr>
          <tr><td><code>exporterFieldCallback</code></td><td>—</td><td><code>(row, column, value) =&gt; unknown</code> — transform cell values</td></tr>
          <tr><td><code>exporterFieldFormatCallback</code></td><td>—</td><td>Custom formatter passed (row, column, value, formatted)</td></tr>
          <tr><td><code>exporterFieldApplyFilters</code></td><td>true</td><td>Apply the column's <code>formatter</code> to the exported value</td></tr>
          <tr><td><code>exporterSuppressColumns</code></td><td><code>[]</code></td><td>Column names to omit from every export</td></tr>
          <tr><td><code>exporterOlderExcelCompatibility</code></td><td>false</td><td>Emit a UTF-8 BOM so older Excel versions pick up the encoding</td></tr>
          <tr><td><code>exporterAllDataFn</code></td><td>—</td><td><code>() =&gt; readonly GridRow[] | Promise&lt;...&gt;</code> — supply the "all" row set (e.g. server-side fetch)</td></tr>
        </tbody>
      </table>

      <h2>PDF Options</h2>
      <p>The pdfMake-format option matrix. Everything plugs straight into the produced doc definition.</p>
      <table class="docs-table docs-table-compact">
        <thead><tr><th>Option</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>exporterPdfFilename</code></td><td>String or <code>(rowType, colType) =&gt; string</code></td></tr>
          <tr><td><code>exporterPdfOrientation</code></td><td><code>'portrait'</code> / <code>'landscape'</code></td></tr>
          <tr><td><code>exporterPdfPageSize</code></td><td>pdfMake page-size string (e.g. <code>'A4'</code>)</td></tr>
          <tr><td><code>exporterPdfMaxGridWidth</code></td><td>Maximum total table width before column-width scaling kicks in</td></tr>
          <tr><td><code>exporterPdfDefaultStyle</code> / <code>TableStyle</code> / <code>TableHeaderStyle</code></td><td>pdfMake style objects</td></tr>
          <tr><td><code>exporterPdfLayout</code></td><td>Table border / padding layout</td></tr>
          <tr><td><code>exporterPdfHeader</code> / <code>Footer</code></td><td>Per-page chrome (string or pdfMake content object)</td></tr>
          <tr><td><code>exporterPdfCustomFormatter</code></td><td><code>(doc) =&gt; doc</code> — last-mile mutation before rendering</td></tr>
        </tbody>
      </table>

      <h2>Excel Options</h2>
      <table class="docs-table docs-table-compact">
        <thead><tr><th>Option</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td><code>exporterExcelFilename</code></td><td>String or <code>(rowType, colType) =&gt; string</code></td></tr>
          <tr><td><code>exporterExcelSheetName</code></td><td>String or <code>(rowType, colType) =&gt; string</code></td></tr>
          <tr><td><code>exporterExcelHeader</code></td><td>Prepended sheet chrome passed through to ExcelBuilder</td></tr>
          <tr><td><code>exporterExcelCustomFormatters</code></td><td><code>(context) =&gt; partialStyles</code> — register custom cell styles</td></tr>
          <tr><td><code>exporterColumnScaleFactor</code></td><td>Multiplier on column-width pixels when writing to the sheet</td></tr>
        </tbody>
      </table>

      <h2>Column + Row Overrides</h2>
      <table class="docs-table">
        <thead><tr><th>Flag</th><th>Location</th><th>Effect</th></tr></thead>
        <tbody>
          <tr><td><code>exporterSuppressExport</code></td><td><code>colDef</code></td><td>Omit this column from every export</td></tr>
          <tr><td><code>exporterPdfAlign</code></td><td><code>colDef</code></td><td>Per-column text alignment for PDF output</td></tr>
          <tr><td><code>exporterEnableExporting</code></td><td><code>GridRow</code> (runtime flag)</td><td>false skips the row in every export</td></tr>
          <tr><td>selectionRowHeaderCol / treeBaseRowHeaderCol</td><td>auto-suppressed</td><td>Row-header chrome never appears in exports</td></tr>
        </tbody>
      </table>

      <h2>Grid Menu</h2>
      <p>
        <code>gridApi.exporter.getMenuItems()</code> returns an array of <code>GridExporterMenuItem</code>
        entries that any menu component can render — each entry's <code>shown()</code> gates visibility
        based on the <code>exporterMenu*</code> flags and the current selection count.
      </p>
      <table class="docs-table docs-table-compact">
        <thead><tr><th>Option</th><th>Default</th><th>Gates</th></tr></thead>
        <tbody>
          <tr><td><code>exporterSuppressMenu</code></td><td>false</td><td>All menu entries at once</td></tr>
          <tr><td><code>exporterMenuCsv</code> / <code>Pdf</code> / <code>Excel</code></td><td>true</td><td>Per-format entries</td></tr>
          <tr><td><code>exporterMenuAllData</code> / <code>VisibleData</code> / <code>SelectedData</code></td><td>true</td><td>Per-scope entries</td></tr>
        </tbody>
      </table>

      <h2>Usage</h2>
      <app-code-block lang="typescript" [code]="usageSnippet" />
    </section>
  `,
  styles: `@use '../docs-topic';`,
})
export class DocsExporterComponent {
  private gridApi: UiGridApi | null = null;

  protected readonly demoOptions: GridOptions = {
    id: 'docs-exporter-demo',
    data: createSmallDemoData(6),
    rowHeight: 44,
    enableSorting: true,
    enableFiltering: true,
    enableRowSelection: true,
    enableRowHeaderSelection: true,
    columnDefs: [
      { name: 'name', displayName: 'Customer' },
      { name: 'company' },
      { name: 'status' },
      { name: 'revenue', type: 'number', align: 'end' },
    ],
    exporterCsvFilename: 'exporter-demo.csv',
    exporterPdfFilename: 'exporter-demo.pdf',
    exporterExcelFilename: 'exporter-demo.xlsx',
    onRegisterApi: (api) => {
      this.gridApi = api as UiGridApi;
    },
  };

  protected exportCsv(rowType: 'all' | 'visible' | 'selected'): void {
    this.gridApi?.exporter.csvExport(rowType, 'visible');
  }

  protected exportPdf(rowType: 'all' | 'visible' | 'selected'): void {
    const doc = this.gridApi?.exporter.buildPdfDocDefinition(rowType, 'visible');
    console.log('pdfMake docDefinition:', doc);
  }

  protected exportExcel(rowType: 'all' | 'visible' | 'selected'): void {
    const sheet = this.gridApi?.exporter.buildExcelSheetData(rowType, 'visible');
    console.log('ExcelBuilder sheet data:', sheet);
  }

  protected readonly usageSnippet = `const options: GridOptions = {
  // CSV — always available, no library needed
  exporterCsvFilename: 'customers.csv',
  exporterCsvColumnSeparator: ';',
  exporterOlderExcelCompatibility: true,       // write UTF-8 BOM
  exporterFieldCallback: (_row, column, value) =>
    column.name === 'revenue' ? Number(value) : value,

  // PDF — requires window.pdfMake
  exporterPdfOrientation: 'landscape',
  exporterPdfPageSize: 'A4',
  exporterPdfHeader: 'Customer Report',

  // Excel — requires window.ExcelBuilder
  exporterExcelSheetName: 'Customers',

  onRegisterApi: (api) => {
    // Download now:
    api.exporter.csvExport('visible', 'visible');

    // Or grab the raw structure to persist server-side:
    const csv = api.exporter.buildCsv('all', 'all');
    const doc = api.exporter.buildPdfDocDefinition('all', 'all');
    const sheet = api.exporter.buildExcelSheetData('all', 'all');
  },
};`;
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GridOptions, UiGridComponent } from '@ornery/ui-grid';
import { CodeBlockComponent } from '../../shared/code-block.component';

interface ValidateRow extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  age: number;
}

@Component({
  selector: 'app-docs-validate',
  imports: [UiGridComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="docs-topic">
      <h1>Cell Validation</h1>
      <p class="docs-lead">
        Built-in <code>required</code> / <code>minLength</code> / <code>maxLength</code> validators
        plus a registry for your own. Sync and async validators both resolve to the same
        <code>$$invalid&lt;col&gt;</code> / <code>$$errors&lt;col&gt;</code> markers on the row
        entity so existing cell templates keep working. Invalid cells paint a red corner marker and
        a <code>title</code> tooltip with the joined error messages.
      </p>

      <h2>Declaring Validators</h2>
      <p>
        Use <code>colDef.validators</code>: the key is the validator name, the value is the argument
        passed to the factory. Add as many as you need — they all run on commit.
      </p>
      <app-code-block lang="typescript" [code]="declareSnippet" />

      <h2>Live Example</h2>
      <p>
        Edit any cell. <strong>Name</strong> requires a value, <strong>email</strong> is validated
        asynchronously against a deny-list, <strong>age</strong> must be a positive integer.
      </p>
      <div class="docs-grid-demo">
        <app-ui-grid [options]="demoOptions" />
      </div>

      <h2>Built-in Validators</h2>
      <table class="docs-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Argument</th>
            <th>Rejects</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>required</code></td>
            <td><code>true</code></td>
            <td><code>null</code>, <code>undefined</code>, empty string</td>
          </tr>
          <tr>
            <td><code>minLength</code></td>
            <td><code>number</code></td>
            <td>Strings shorter than the threshold</td>
          </tr>
          <tr>
            <td><code>maxLength</code></td>
            <td><code>number</code></td>
            <td>Strings longer than the threshold</td>
          </tr>
        </tbody>
      </table>

      <h2>Custom Validators</h2>
      <p>
        Register a factory + message builder via <code>gridApi.validate.setValidator</code>. The
        factory receives the argument declared in the column def and returns a function that
        validates <code>(oldValue, newValue, rowEntity, colDef)</code>. Return a
        <code>Promise&lt;boolean&gt;</code>
        for async validation.
      </p>
      <app-code-block lang="typescript" [code]="customSnippet" />

      <h2>Public API</h2>
      <table class="docs-table">
        <thead>
          <tr>
            <th>Method / Event</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>validate.isInvalid(rowEntity, colDef)</code></td>
            <td>Is the cell currently flagged invalid?</td>
          </tr>
          <tr>
            <td><code>validate.getErrorMessages(rowEntity, colDef)</code></td>
            <td>Ordered list of localized error messages for the cell</td>
          </tr>
          <tr>
            <td><code>validate.getFormattedErrors(rowEntity, colDef)</code></td>
            <td>HTML-formatted error block suitable for a tooltip / popover</td>
          </tr>
          <tr>
            <td><code>validate.getTitleFormattedErrors(rowEntity, colDef)</code></td>
            <td>Plaintext error block for the <code>title</code> attribute</td>
          </tr>
          <tr>
            <td><code>validate.runValidators(rowEntity, colDef, newValue, oldValue)</code></td>
            <td>Run the column's validators and await async resolutions</td>
          </tr>
          <tr>
            <td><code>validate.setValidator(name, factory, message)</code></td>
            <td>Register a custom validator</td>
          </tr>
          <tr>
            <td><code>validate.getInvalidRows()</code></td>
            <td>Returns every row that currently has at least one invalid cell</td>
          </tr>
          <tr>
            <td><code>validate.on.validationFailed(fn)</code></td>
            <td>
              Fires on every rejected edit with <code>(rowEntity, colDef, newValue, oldValue)</code>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Styling Hooks</h2>
      <p>
        Invalid cells get the <code>.ui-grid-cell-invalid</code> class. Override the red corner
        marker and background via the usual CSS custom properties:
      </p>
      <table class="docs-table">
        <thead>
          <tr>
            <th>Variable</th>
            <th>Default</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>--ui-grid-cell-invalid-bg</code></td>
            <td>red-tinted surface</td>
            <td>Background color of invalid cells</td>
          </tr>
          <tr>
            <td><code>--ui-grid-cell-invalid-marker-color</code></td>
            <td>#FF0000</td>
            <td>Corner marker color</td>
          </tr>
          <tr>
            <td><code>--ui-grid-cell-invalid-marker-size</code></td>
            <td>8px</td>
            <td>Corner marker size</td>
          </tr>
        </tbody>
      </table>

      <h2>i18n</h2>
      <p>
        Built-in error messages read from <code>labels.validateRequired</code> /
        <code>validateMinLength</code> / <code>validateMaxLength</code> /
        <code>validateError</code>. Override per-grid via <code>options.labels</code> or register a
        complete locale via <code>gridApi.i18n.add</code>.
      </p>
    </section>
  `,
  styles: `
    @use '../docs-topic';
  `,
})
export class DocsValidateComponent {
  protected readonly demoOptions: GridOptions = {
    id: 'docs-validate-demo',
    rowHeight: 44,
    enableCellEdit: true,
    rowIdentity: (row) => String((row as ValidateRow).id),
    data: [
      { id: 'v1', name: 'Alice', email: 'alice@example.com', age: 29 },
      { id: 'v2', name: 'Bob', email: 'bob@example.com', age: 41 },
      { id: 'v3', name: 'Carol', email: 'carol@example.com', age: 35 },
    ] satisfies ValidateRow[],
    columnDefs: [
      {
        name: 'name',
        displayName: 'Name',
        enableCellEdit: true,
        validators: { required: true, minLength: 2 },
      },
      {
        name: 'email',
        displayName: 'Email',
        enableCellEdit: true,
        validators: { required: true, minLength: 5 },
      },
      {
        name: 'age',
        displayName: 'Age',
        type: 'number',
        align: 'end',
        enableCellEdit: true,
        validators: { required: true },
      },
    ],
  };

  protected readonly declareSnippet = `const columns: GridColumnDef[] = [
  {
    name: 'name',
    enableCellEdit: true,
    validators: {
      required: true,     // built-in: rejects empty strings / null
      minLength: 2,       // built-in: rejects strings shorter than 2
    },
  },
  {
    name: 'email',
    enableCellEdit: true,
    validators: {
      required: true,
      emailFormat: true,  // custom — register via gridApi.validate.setValidator
    },
  },
];`;

  protected readonly customSnippet = `gridApi.validate.setValidator(
  'emailFormat',
  // factory — receives the argument declared in colDef.validators.emailFormat
  () => (_oldValue, newValue) => {
    if (newValue == null || newValue === '') return true;   // required handles empties
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(String(newValue));
  },
  // message — read from labels so it localizes automatically
  () => gridApi.i18n.get(gridApi.i18n.getCurrentLang()).validateError
     || 'Invalid email address',
);

// Async example — validator factory returns a Promise<boolean>:
gridApi.validate.setValidator(
  'uniqueUsername',
  () => async (_oldValue, newValue) => {
    const response = await fetch(\`/api/usernames?check=\${newValue}\`);
    const { available } = await response.json();
    return available;
  },
  () => 'Username is already taken',
);

// Listen for validation failures (e.g. show a toast):
gridApi.validate.on.validationFailed((rowEntity, colDef, newValue, oldValue) => {
  toast.error(\`\${colDef.name}: rejected \${String(newValue)}\`);
});
`;
}

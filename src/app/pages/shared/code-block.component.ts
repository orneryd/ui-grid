import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-code-block',
  template: `<pre [attr.data-lang]="lang()"><code>{{ code() }}</code></pre>`,
  styles: `
    :host {
      display: block;
    }
    pre {
      margin: 0;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      border: 1px solid var(--card-border, rgba(0, 0, 0, 0.1));
      background: var(--panel-surface-strong, #1a1a2e);
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      white-space: pre;
      word-break: normal;
      overflow-wrap: normal;
      text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--ink-strong, #e0e0e0);
    }
    code {
      display: block;
      width: max-content;
      min-width: 100%;
      font: inherit;
    }
    pre::before {
      content: attr(data-lang);
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--teal-strong, #5eead4);
    }
    @media (max-width: 640px) {
      pre {
        padding: 0.85rem 1rem;
        font-size: 0.75rem;
        line-height: 1.5;
      }

      pre::before {
        font-size: 0.66rem;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeBlockComponent {
  readonly code = input.required<string>();
  readonly lang = input<string>();
}

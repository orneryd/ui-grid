const thisRegex = /^(this|props)\./i;
const nestedES6 = /\$\{.*(\$\{(.+?)\}).*\}/g;
const es6Regex = /\$\{(.+?)\}/g;

function getFromObj(path: string, obj: Record<string, unknown> = {}): unknown {
  path = path?.trim();
  if (path != null) {
    if (obj[path] != null) return obj[path];
    if (/^[\w-]+(\.[\w-]+)+$/.test(path)) {
      return path.split('.').reduce<unknown>((res, key) => {
        return (res as Record<string, unknown>)?.[key] ?? path;
      }, obj);
    }
  }
  return path;
}

function interpolate(expr: string, context: Record<string, unknown>): string {
  if (typeof expr !== 'string') return expr;
  es6Regex.lastIndex = 0;
  nestedES6.lastIndex = 0;
  let result = expr.replace(thisRegex, '');
  let matchArr: RegExpExecArray | null;
  while ((matchArr = nestedES6.exec(result))) {
    const [, outerMatch, key] = matchArr;
    const replacement = String(getFromObj(key.replace(thisRegex, ''), context));
    result = interpolate(result.replace(outerMatch, replacement).trim(), context);
  }
  return result.replace(es6Regex, (_match, $1: string) =>
    String(getFromObj($1.replace(thisRegex, ''), context))
  );
}

function bindEvents(root: HTMLElement, context: Record<string, unknown>): HTMLElement {
  const domElements = Array.from(root.querySelectorAll('*'));
  domElements.forEach((el) => {
    Array.from(el.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('on')) {
        let fnOrName: unknown = interpolate(attribute.value, context);
        if (typeof (context as Record<string, unknown>)[fnOrName as string] === 'function') {
          fnOrName = (context as Record<string, unknown>)[fnOrName as string];
        }
        if (typeof fnOrName === 'function') {
          const fn = fnOrName as (...args: unknown[]) => void;
          el.addEventListener(attribute.name.replace('on', ''), function (...args: unknown[]) {
            fn.apply(context, args);
          });
        }
        el.removeAttribute(attribute.name);
      }
    });
  });
  return root;
}

type ConnectableNodeList = Node[] & {
  connect(root: Element | ShadowRoot): void;
};

function setupConnect(nodeList: Node[], _context: Record<string, unknown>): ConnectableNodeList {
  const result = nodeList as ConnectableNodeList;
  result.connect = function (root: Element | ShadowRoot) {
    if (typeof HTMLElement === 'undefined') return;
    if (root) {
      root.innerHTML = '';
      result.forEach((node) => root.appendChild(node));
    }
  };
  return result;
}

/**
 * A declarative template element for defining reusable cell/row templates
 * without writing JavaScript.
 *
 * Supports both `${this.prop}` and `{{prop}}` binding syntax.
 *
 * @example
 * ```html
 * <template is="ui-grid-template" name="ui-status-badge" status="unknown">
 *   <style>
 *     :host { display: inline-block; }
 *     .badge { padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
 *     .badge-active { background: #d1fae5; color: #065f46; }
 *     .badge-inactive { background: #fee2e2; color: #991b1b; }
 *   </style>
 *   <span class="badge badge-${this.status}">${this.status}</span>
 * </template>
 *
 * <ui-grid-element>
 *   <template slot="cell-status">
 *     <ui-status-badge status="{{value}}"></ui-status-badge>
 *   </template>
 * </ui-grid-element>
 * ```
 */
export class UIGridTemplate extends HTMLTemplateElement {
  static readonly TAG = 'ui-grid-template';

  connectedCallback(): void {
    const componentName = this.getAttribute('name') || this.getAttribute('id');
    if (!componentName) {
      throw new Error(
        'ui-grid-template requires a "name" or "id" attribute to register the component'
      );
    }

    const htmlTemplate = this.innerHTML;
    const defaultAttrs = this;

    const render = (props: Record<string, unknown> = {}) => {
      const rendered = htmlTemplate.replace(/\$\{.+?}/gim, (s) => {
        return interpolate(s, props) as string;
      }).replace(/{{\s*([^}]+?)\s*}}/g, (_match, expression) => {
        return interpolate('${' + String(expression).trim() + '}', props) as string;
      });
      const parsed = new DOMParser().parseFromString(rendered, 'text/html');
      const elements = [...parsed.head.children, ...bindEvents(parsed.body, props).childNodes];
      return setupConnect(elements, props);
    };

    if (!customElements.get(componentName)) {
      customElements.define(
        componentName,
        class extends HTMLElement {
          private _observer: MutationObserver | null = null;

          constructor() {
            super();
            this.attachShadow({ mode: 'open' });
          }

          connectedCallback(): void {
            this.applyAttributes();
            this._observer = new MutationObserver(() => this.applyAttributes());
            this._observer.observe(this, { attributes: true });
          }

          applyAttributes(): void {
            const props: Record<string, string> = {};
            Array.from(defaultAttrs.attributes).forEach((attr) => {
              if (attr.name !== 'is' && attr.name !== 'name' && attr.name !== 'id') {
                props[attr.name] = attr.value;
              }
            });
            Array.from(this.attributes).forEach((attr) => {
              props[attr.name] = attr.value;
            });
            render(props).connect(this.shadowRoot!);
          }

          disconnectedCallback(): void {
            this._observer?.disconnect();
            this._observer = null;
          }
        },
      );
    }
  }

  static define(tagName = UIGridTemplate.TAG): void {
    if (!customElements.get(tagName)) {
      customElements.define(tagName, UIGridTemplate, { extends: 'template' });
    }
  }
}

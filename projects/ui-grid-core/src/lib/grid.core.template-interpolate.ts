/**
 * Template string interpolation — pure string logic extracted from the
 * vanilla grid element so any wrapper that wants the same `{{expression}}`
 * / `${expression}` binding semantics can share it.
 *
 * Both syntaxes resolve dotted paths against the provided context object;
 * the `${expression}` form additionally strips a leading `this.` or `props.`
 * so the same template string works inside the vanilla element and any
 * consumer that wants to eval bindings in its own scope.
 *
 * HTML escaping is injected as a parameter so this module stays DOM-free —
 * vanilla callers pass the browser-safe escape, React/Angular wrappers
 * pass their own if they want different semantics.
 */

export type GridTemplateEscape = (value: unknown) => string;

/**
 * Replace `{{…}}` and `${…}` bindings in `templateMarkup` with values
 * resolved from `context`. Unknown paths resolve to the empty string.
 */
export function interpolateGridTemplate(
  templateMarkup: string,
  context: Record<string, unknown>,
  escape: GridTemplateEscape,
): string {
  return templateMarkup
    .replace(/{{\s*([^}]+?)\s*}}/g, (_match, expression) => {
      const value = resolveGridTemplateValue(context, String(expression).trim());
      return escape(value);
    })
    .replace(/\$\{(.+?)\}/g, (_match, expression) => {
      // Strip "this." or "props." prefix for consistency with @ornery/web-components.
      const cleaned = String(expression).trim().replace(/^(this|props)\./, '');
      const value = resolveGridTemplateValue(context, cleaned);
      return escape(value);
    });
}

/**
 * Resolve a dotted expression (`row.account.owner`) against a context
 * object. Returns the empty string for any missing path segment.
 */
export function resolveGridTemplateValue(
  context: Record<string, unknown>,
  expression: string,
): unknown {
  const segments = expression.split('.').filter(Boolean);
  let current: unknown = context;

  for (const segment of segments) {
    if (current == null || typeof current !== 'object') {
      return '';
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current ?? '';
}

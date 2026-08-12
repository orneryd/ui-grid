/**
 * DOM + HTML utility helpers shared across the element's render / patch paths.
 *
 * `utils/*` modules may only depend on package-level imports — never on any
 * other file in `src/`. Anything else risks forming an import cycle through
 * the element root.
 */

export function escapeHtml(value: unknown): string {
  const text = String(value ?? '');
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function setAttr(el: HTMLElement, name: string, value: string): void {
  if (el.getAttribute(name) !== value) {
    el.setAttribute(name, value);
  }
}

export function setClass(el: HTMLElement, value: string): void {
  if (el.className !== value) {
    el.className = value;
  }
}

export function setStyle(el: HTMLElement, value: string): void {
  const current = el.getAttribute('style');
  if (value) {
    if (current !== value) el.setAttribute('style', value);
  } else if (current !== null) {
    el.removeAttribute('style');
  }
}

/**
 * Parse a fragment of HTML and return its first element child. Returns null
 * when the markup is empty or contains only non-element nodes.
 */
export function createFromMarkup(html: string): HTMLElement | null {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;
  return wrapper.firstElementChild as HTMLElement | null;
}

/**
 * Swap an element inside a container, preserving the container's other
 * children. Appends when there is no existing element.
 */
export function swapBodyChild(
  container: HTMLElement,
  current: HTMLElement | null,
  next: HTMLElement,
): void {
  if (current) {
    container.replaceChild(next, current);
  } else {
    container.appendChild(next);
  }
}

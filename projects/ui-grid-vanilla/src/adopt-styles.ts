let sheetsSupported: boolean | null = null;

function supportsAdoptedStyleSheets(): boolean {
  if (sheetsSupported === null) {
    try {
      const s = new CSSStyleSheet();
      s.replaceSync('');
      sheetsSupported = true;
    } catch {
      sheetsSupported = false;
    }
  }
  return sheetsSupported;
}

const sheetCache = new WeakMap<object, CSSStyleSheet>();

export function adoptStyles(shadowRoot: ShadowRoot, css: string, key: object): void {
  if (!supportsAdoptedStyleSheets()) {
    let styleEl = shadowRoot.querySelector('style[data-grid-styles]') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.setAttribute('data-grid-styles', '');
      styleEl.textContent = css;
      shadowRoot.prepend(styleEl);
    }
    return;
  }

  let sheet = sheetCache.get(key);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    sheetCache.set(key, sheet);
  }
  if (!shadowRoot.adoptedStyleSheets.includes(sheet)) {
    shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
  }
}

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
    const own = shadowRoot.adoptedStyleSheets.filter((s) => !isUserSheet(shadowRoot, s));
    shadowRoot.adoptedStyleSheets = [...own, sheet, ...userSheetsOf(shadowRoot)];
  }
}

// App sheets from addStyles stay after the grid's own sheets so they win at
// equal specificity, even when the grid adopts a sheet later.
const userSheets = new WeakMap<ShadowRoot, CSSStyleSheet[]>();

function userSheetsOf(shadowRoot: ShadowRoot): CSSStyleSheet[] {
  return userSheets.get(shadowRoot) ?? [];
}

function isUserSheet(shadowRoot: ShadowRoot, sheet: CSSStyleSheet): boolean {
  return userSheetsOf(shadowRoot).includes(sheet);
}

export function addUserStyles(shadowRoot: ShadowRoot, css: string): () => void {
  if (!supportsAdoptedStyleSheets()) {
    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    shadowRoot.append(styleEl);
    return () => styleEl.remove();
  }
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  userSheets.set(shadowRoot, [...userSheetsOf(shadowRoot), sheet]);
  shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
  return () => {
    userSheets.set(shadowRoot, userSheetsOf(shadowRoot).filter((s) => s !== sheet));
    shadowRoot.adoptedStyleSheets = shadowRoot.adoptedStyleSheets.filter((s) => s !== sheet);
  };
}

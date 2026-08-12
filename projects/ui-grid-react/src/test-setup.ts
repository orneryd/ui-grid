if (typeof ShadowRoot !== 'undefined') {
  const proto = ShadowRoot.prototype as unknown as Record<string, unknown>;
  if (!('adoptedStyleSheets' in proto)) {
    Object.defineProperty(proto, 'adoptedStyleSheets', {
      get() {
        return (this as unknown as Record<string, unknown>)['_adoptedStyleSheets'] ?? [];
      },
      set(sheets: CSSStyleSheet[]) {
        (this as unknown as Record<string, unknown>)['_adoptedStyleSheets'] = sheets;
      },
    });
  }
}

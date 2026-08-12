/**
 * Vitest setup file — polyfills APIs that jsdom does not fully implement
 * so that tests exercise the real adoptedStyleSheets code path.
 */

if (typeof CSSStyleSheet !== 'undefined' && !CSSStyleSheet.prototype.replaceSync) {
  CSSStyleSheet.prototype.replaceSync = function (text: string) {
    (this as any).__cssText = text;
  };
}

const originalAttachShadow = HTMLElement.prototype.attachShadow;
HTMLElement.prototype.attachShadow = function (init: ShadowRootInit): ShadowRoot {
  const shadow = originalAttachShadow.call(this, init);
  if (!shadow.adoptedStyleSheets) {
    Object.defineProperty(shadow, 'adoptedStyleSheets', {
      value: [],
      writable: true,
      configurable: true,
    });
  }
  return shadow;
};

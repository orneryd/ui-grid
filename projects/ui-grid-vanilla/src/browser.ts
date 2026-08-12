export * from './index';
export { defineStandaloneUiGridElement } from './ui-grid-standalone.element';

import { defineStandaloneUiGridElement } from './ui-grid-standalone.element';

if (typeof window !== 'undefined' && typeof customElements !== 'undefined') {
  void defineStandaloneUiGridElement();
}

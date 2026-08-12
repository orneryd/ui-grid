import type { GridOptions } from '@ornery/ui-grid-core';

export interface MountUiGridCustomElementOptions {
  options: GridOptions;
  tagName?: string;
  ensureDefined?: (tagName: string) => Promise<void> | void;
}

export interface MountedUiGridCustomElement {
  element: HTMLElement & { options: GridOptions };
  unmount: () => void;
}

export async function mountUiGridCustomElement(
  container: Element,
  mountOptions: MountUiGridCustomElementOptions,
): Promise<MountedUiGridCustomElement> {
  const tagName = mountOptions.tagName ?? 'ui-grid-element';

  if (mountOptions.ensureDefined) {
    await mountOptions.ensureDefined(tagName);
  }

  const element = document.createElement(tagName) as HTMLElement & { options: GridOptions };
  element.options = mountOptions.options;
  container.replaceChildren(element);

  return {
    element,
    unmount: () => {
      if (container.firstElementChild === element) {
        container.replaceChildren();
      }
    },
  };
}

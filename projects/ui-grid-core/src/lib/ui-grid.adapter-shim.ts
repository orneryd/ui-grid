import type { GridOptions } from './grid.models';

export interface UiGridAdapterHooks {
  // Future migration seam: adapters can provide a controller-backed element mount path.
  mountControllerBackedElement?: (host: Element, options: GridOptions) => boolean;
}

let registeredHooks: UiGridAdapterHooks | null = null;

export function registerUiGridAdapterHooks(hooks: UiGridAdapterHooks | null): void {
  registeredHooks = hooks;
}

export function getUiGridAdapterHooks(): UiGridAdapterHooks | null {
  return registeredHooks;
}

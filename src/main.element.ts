import { defineStandaloneUiGridElement } from '@ornery/ui-grid-vanilla';

async function bootstrapElement(): Promise<void> {
  await defineStandaloneUiGridElement();
}

void bootstrapElement();

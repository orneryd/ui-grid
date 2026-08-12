import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DocsGettingStartedComponent } from './topics/getting-started.component';
import { DocsFeaturesComponent } from './topics/features.component';
import { DocsThemingTopicComponent } from './topics/theming-topic.component';
import { DocsApiReferenceComponent } from './topics/api-reference.component';
import { DocsCellEditingComponent } from './topics/cell-editing.component';
import { DocsRowEditComponent } from './topics/row-edit.component';
import { DocsValidateComponent } from './topics/validate.component';
import { DocsSelectionComponent } from './topics/selection.component';
import { DocsTreeViewComponent } from './topics/tree-view.component';
import { DocsExpandableRowsComponent } from './topics/expandable-rows.component';
import { DocsPaginationComponent } from './topics/pagination.component';
import { DocsPinningComponent } from './topics/pinning.component';
import { DocsColumnMovingComponent } from './topics/column-moving.component';
import { DocsInfiniteScrollComponent } from './topics/infinite-scroll.component';
import { DocsSaveStateComponent } from './topics/save-state.component';
import { DocsKeyboardNavigationComponent } from './topics/keyboard-navigation.component';
import { DocsExporterComponent } from './topics/exporter.component';
import { DocsImporterComponent } from './topics/importer.component';
import { DocsCustomBuildsComponent } from './topics/custom-builds.component';
import { DocsWebComponentComponent } from './topics/web-component.component';
import { DocsCustomComponentsComponent } from './topics/custom-components.component';
import { DocsI18nComponent } from './topics/i18n.component';
import { DocsAccessibilityComponent } from './topics/accessibility.component';
import { DocsReactComponent } from './topics/react.component';
import { DocsRustComponent } from './topics/rust.component';
import { DocsRustEguiComponent } from './topics/rust-egui.component';

@Component({
  selector: 'app-docs-layout',
  imports: [
    RouterLink,
    DocsGettingStartedComponent,
    DocsFeaturesComponent,
    DocsThemingTopicComponent,
    DocsApiReferenceComponent,
    DocsCellEditingComponent,
    DocsRowEditComponent,
    DocsValidateComponent,
    DocsSelectionComponent,
    DocsTreeViewComponent,
    DocsExpandableRowsComponent,
    DocsPaginationComponent,
    DocsPinningComponent,
    DocsColumnMovingComponent,
    DocsInfiniteScrollComponent,
    DocsSaveStateComponent,
    DocsKeyboardNavigationComponent,
    DocsExporterComponent,
    DocsImporterComponent,
    DocsCustomBuildsComponent,
    DocsWebComponentComponent,
    DocsCustomComponentsComponent,
    DocsI18nComponent,
    DocsAccessibilityComponent,
    DocsReactComponent,
    DocsRustComponent,
    DocsRustEguiComponent,
  ],
  templateUrl: './docs-layout.component.html',
  styleUrl: './docs-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsLayoutComponent {
  protected readonly topics = [
    { id: 'getting-started', label: 'Getting Started' },
    { id: 'features', label: 'Features' },
    { id: 'theming', label: 'Theming' },
    { id: 'api-reference', label: 'API Reference' },
    { id: 'cell-editing', label: 'Cell Editing' },
    { id: 'row-edit', label: 'Row Edit' },
    { id: 'validate', label: 'Cell Validation' },
    { id: 'selection', label: 'Row Selection' },
    { id: 'tree-view', label: 'Tree View' },
    { id: 'expandable-rows', label: 'Expandable Rows' },
    { id: 'pagination', label: 'Pagination' },
    { id: 'pinning', label: 'Column Pinning' },
    { id: 'column-moving', label: 'Column Moving / Resizing' },
    { id: 'infinite-scroll', label: 'Infinite Scroll' },
    { id: 'save-state', label: 'Save / Restore State' },
    { id: 'keyboard-navigation', label: 'Keyboard Navigation' },
    { id: 'exporter', label: 'Exporter (CSV / PDF / Excel)' },
    { id: 'importer', label: 'Importer' },
    { id: 'custom-builds', label: 'Custom Builds' },
    { id: 'web-component', label: 'Web Component' },
    { id: 'custom-components', label: 'Custom Sub-Components' },
    { id: 'i18n', label: 'Internationalization' },
    { id: 'accessibility', label: 'Accessibility' },
    { id: 'rust', label: 'Rust / WASM' },
    { id: 'rust-egui', label: 'Rust / egui' },
  ] as const;

  private readonly route = inject(ActivatedRoute);
  private readonly topicParam = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('topic'))),
    { initialValue: null },
  );

  protected readonly activeTopic = computed(() => this.topicParam() ?? 'getting-started');
}

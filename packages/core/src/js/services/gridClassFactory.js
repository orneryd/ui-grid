(function () {
  'use strict';
  /**
   *  @ngdoc object
   *  @name ui.grid.service:gridClassFactory
   *
   *  @description factory to return dom specific instances of a grid
   *
   */
  angular.module('ui.grid').service('gridClassFactory', ['gridUtil', '$q', '$compile', '$templateCache', 'uiGridConstants', 'Grid', 'GridColumn', 'GridRow',
    function (gridUtil, $q, $compile, $templateCache, uiGridConstants, Grid, GridColumn, GridRow) {

      var service = {
        /**
         * @ngdoc method
         * @name createGrid
         * @methodOf ui.grid.service:gridClassFactory
         * @description Creates a new grid instance. Each instance will have a unique id
         * @param {object} options An object map of options to pass into the created grid instance.
         * @returns {Grid} grid
         */
        createGrid : function(options) {
          options = (typeof(options) !== 'undefined') ? options : {};
          options.id = gridUtil.newId();
          var grid = new Grid(options);

          // NOTE/TODO: rowTemplate should always be defined...
          if (grid.options.rowTemplate) {
            var rowTemplateFnPromise = $q.defer();
            grid.getRowTemplateFn = rowTemplateFnPromise.promise;

            gridUtil.getTemplate(grid.options.rowTemplate)
              .then(
                function (template) {
                  var rowTemplateFn = $compile(template);
                  rowTemplateFnPromise.resolve(rowTemplateFn);
                },
                function () {
                  // Todo handle response error here?
                  throw new Error("Couldn't fetch/use row template '" + grid.options.rowTemplate + "'");
                }).catch(function(err) { $log.error(err); });
          }

          grid.registerColumnBuilder(service.defaultColumnBuilder);

          // Row builder for custom row templates
          grid.registerRowBuilder(service.rowTemplateAssigner);

          // Reset all rows to visible initially
          grid.registerRowsProcessor(function allRowsVisible(rows) {
            rows.forEach(function (row) {
              row.evaluateRowVisibility( true );
            });

            return rows;
          }, 50);

          grid.registerColumnsProcessor(function applyColumnVisibility(columns) {
            columns.forEach(function (column) {
              column.visible = angular.isDefined(column.colDef.visible) ? column.colDef.visible : true;
            });

            return columns;
          }, 50);

          grid.registerRowsProcessor(grid.searchRows, 100);

          // Register the default row processor, it sorts rows by selected columns
          if (grid.options.externalSort && angular.isFunction(grid.options.externalSort)) {
            grid.registerRowsProcessor(grid.options.externalSort, 200);
          }
          else {
            grid.registerRowsProcessor(grid.sortByColumn, 200);
          }

          return grid;
        },

        /**
         * @ngdoc function
         * @name defaultColumnBuilder
         * @methodOf ui.grid.service:gridClassFactory
         * @description Processes designTime column definitions and applies them to col for the
         *              core grid features
         * @param {object} colDef reference to column definition
         * @param {GridColumn} col reference to gridCol
         * @param {object} gridOptions reference to grid options
         */
        defaultColumnBuilder: function (colDef, col, gridOptions) {

          var templateGetPromises = [];

          // Abstracts the standard template processing we do for every template type.
          var processTemplate = function( templateType, providedType, defaultTemplate, filterType, tooltipType ) {
            if ( !colDef[templateType] ) {
              col[providedType] = defaultTemplate;
            } else {
              col[providedType] = colDef[templateType];
            }

            var templatePromise = gridUtil.getTemplate(col[providedType])
              .then(
                function (template) {
                  if ( angular.isFunction(template) ) { template = template(); }
                  var tooltipCall = ( tooltipType === 'cellTooltip' )
                      ? 'col.cellTooltip(row,col)'
                      : 'col.headerTooltip(col)';
                  if ( tooltipType && col[tooltipType] === false ) {
                    template = template.replace(uiGridConstants.TOOLTIP, '');
                  } else if ( tooltipType && col[tooltipType] ) {
                    template = template.replace(uiGridConstants.TOOLTIP, 'title="{{' + tooltipCall + ' CUSTOM_FILTERS }}"');
                  }

                  if ( filterType ) {
                    template = template.replace(uiGridConstants.CUSTOM_FILTERS, function() {
                      return col[filterType] ? "|" + col[filterType] : "";
                    });
                  }
                  return gridUtil.postProcessTemplate(template).then(function(template) {
                    col[templateType] = template;
                  });
                },
                function () {
                  throw new Error("Couldn't fetch/use colDef." + templateType + " '" + colDef[templateType] + "'");
                }).catch(function(err) { $log.error(err); });

            templateGetPromises.push(templatePromise);

            return templatePromise;
          };


          /**
           * @ngdoc property
           * @name cellTemplate
           * @propertyOf ui.grid.class:GridOptions.columnDef
           * @description a custom template for each cell in this column.  The default
           * is ui-grid/uiGridCell.  If you are using the cellNav feature, this template
           * must contain a div that can receive focus.
           *
           */
          col.cellTemplatePromise = processTemplate( 'cellTemplate', 'providedCellTemplate', 'ui-grid/uiGridCell', 'cellFilter', 'cellTooltip' );

          /**
           * @ngdoc property
           * @name headerCellTemplate
           * @propertyOf ui.grid.class:GridOptions.columnDef
           * @description a custom template for the header for this column.  The default
           * is ui-grid/uiGridHeaderCell
           *
           */
          col.headerCellTemplatePromise = processTemplate( 'headerCellTemplate', 'providedHeaderCellTemplate', 'ui-grid/uiGridHeaderCell', 'headerCellFilter', 'headerTooltip' );

          /**
           * @ngdoc property
           * @name footerCellTemplate
           * @propertyOf ui.grid.class:GridOptions.columnDef
           * @description a custom template for the footer for this column.  The default
           * is ui-grid/uiGridFooterCell
           *
           */
          col.footerCellTemplatePromise = processTemplate( 'footerCellTemplate', 'providedFooterCellTemplate', 'ui-grid/uiGridFooterCell', 'footerCellFilter' );

          /**
           * @ngdoc property
           * @name filterHeaderTemplate
           * @propertyOf ui.grid.class:GridOptions.columnDef
           * @description a custom template for the filter input.  The default is ui-grid/ui-grid-filter
           *
           */
          col.filterHeaderTemplatePromise = processTemplate( 'filterHeaderTemplate', 'providedFilterHeaderTemplate', 'ui-grid/ui-grid-filter' );

          // Create a promise for the compiled element function
          col.compiledElementFnDefer = $q.defer();

          return $q.all(templateGetPromises);
        },

        rowTemplateAssigner: function rowTemplateAssigner(row) {
          var grid = this;

          // Row has no template assigned to it
          if (!row.rowTemplate) {
            // Use the default row template from the grid
            row.rowTemplate = grid.options.rowTemplate;

            // Use the grid's function for fetching the compiled row template function
            row.getRowTemplateFn = grid.getRowTemplateFn;
          }
          // Row has its own template assigned
          else {
            // Create a promise for the compiled row template function
            var perRowTemplateFnPromise = $q.defer();
            row.getRowTemplateFn = perRowTemplateFnPromise.promise;

            // Get the row template
            gridUtil.getTemplate(row.rowTemplate)
              .then(function (template) {
                // Compile the template
                var rowTemplateFn = $compile(template);

                // Resolve the compiled template function promise
                perRowTemplateFnPromise.resolve(rowTemplateFn);
              },
              function () {
                // Todo handle response error here?
                throw new Error("Couldn't fetch/use row template '" + row.rowTemplate + "'");
              });
          }

          return row.getRowTemplateFn;
        }
      };

      // class definitions (moved to separate factories)

      return service;
    }]);

})();

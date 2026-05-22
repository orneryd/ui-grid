(function () {
  'use strict';

  angular.module('ui.grid').controller('uiGridController', ['$scope', '$element', '$attrs', 'gridUtil', '$q', 'uiGridConstants',
                    'gridClassFactory', '$parse', '$compile',
    function ($scope, $elm, $attrs, gridUtil, $q, uiGridConstants,
              gridClassFactory, $parse, $compile) {
      // gridUtil.logDebug('ui-grid controller');
      var self = this;
      var deregFunctions = [];

      self.grid = gridClassFactory.createGrid($scope.uiGrid);

      // assign $scope.$parent if appScope not already assigned
      self.grid.appScope = self.grid.appScope || $scope.$parent;

      $elm.addClass('grid' + self.grid.id);
      self.grid.rtl = gridUtil.getStyles($elm[0])['direction'] === 'rtl';


      // angular.extend(self.grid.options, );

      // all properties of grid are available on scope
      $scope.grid = self.grid;

      if ($attrs.uiGridColumns) {
        deregFunctions.push( $attrs.$observe('uiGridColumns', function(value) {
          self.grid.options.columnDefs = angular.isString(value) ? angular.fromJson(value) : value;
          self.grid.buildColumns()
            .then(function() {
              self.grid.preCompileCellTemplates();

              self.grid.refreshCanvas(true);
            }).catch(function(err) { $log.error(err); });
        }) );
      }

      // prevents an error from being thrown when the array is not defined yet and fastWatch is on
      function getSize(array) {
        return array ? array.length : 0;
      }

      // if fastWatch is set we watch only the length and the reference, not every individual object
      if (self.grid.options.fastWatch) {
        self.uiGrid = $scope.uiGrid;
        if (angular.isString($scope.uiGrid.data)) {
          deregFunctions.push( $scope.$parent.$watch($scope.uiGrid.data, dataWatchFunction) );
          deregFunctions.push( $scope.$parent.$watch(function() {
            if ( self.grid.appScope[$scope.uiGrid.data] ) {
              return self.grid.appScope[$scope.uiGrid.data].length;
            } else {
              return undefined;
            }
          }, dataWatchFunction) );
        } else {
          deregFunctions.push( $scope.$parent.$watch(function() { return $scope.uiGrid.data; }, dataWatchFunction) );
          deregFunctions.push( $scope.$parent.$watch(function() { return getSize($scope.uiGrid.data); }, function() { dataWatchFunction($scope.uiGrid.data); }) );
        }
        deregFunctions.push( $scope.$parent.$watch(function() { return $scope.uiGrid.columnDefs; }, columnDefsWatchFunction) );
        deregFunctions.push( $scope.$parent.$watch(function() { return getSize($scope.uiGrid.columnDefs); }, function() { columnDefsWatchFunction($scope.uiGrid.columnDefs); }) );
      } else {
        if (angular.isString($scope.uiGrid.data)) {
          deregFunctions.push( $scope.$parent.$watchCollection($scope.uiGrid.data, dataWatchFunction) );
        } else {
          deregFunctions.push( $scope.$parent.$watchCollection(function() { return $scope.uiGrid.data; }, dataWatchFunction) );
        }
        deregFunctions.push( $scope.$parent.$watchCollection(function() { return $scope.uiGrid.columnDefs; }, columnDefsWatchFunction) );
      }


      function columnDefsWatchFunction(n, o) {
        if (n && n !== o) {
          self.grid.options.columnDefs = $scope.uiGrid.columnDefs;
          self.grid.callDataChangeCallbacks(uiGridConstants.dataChange.COLUMN, {
            orderByColumnDefs: true,
            preCompileCellTemplates: true
          });
        }
      }

      var mostRecentData;

      function dataWatchFunction(newData) {
        // gridUtil.logDebug('dataWatch fired');
        var promises = [];

        if ( self.grid.options.fastWatch ) {
          if (angular.isString($scope.uiGrid.data)) {
            newData = self.grid.appScope.$eval($scope.uiGrid.data);
          } else {
            newData = $scope.uiGrid.data;
          }
        }

        mostRecentData = newData;

        if (newData) {
          // columns length is greater than the number of row header columns, which don't count because they're created automatically
          var hasColumns = self.grid.columns.length > (self.grid.rowHeaderColumns ? self.grid.rowHeaderColumns.length : 0);

          if (
            // If we have no columns
            !hasColumns &&
            // ... and we don't have a ui-grid-columns attribute, which would define columns for us
            !$attrs.uiGridColumns &&
            // ... and we have no pre-defined columns
            self.grid.options.columnDefs.length === 0 &&
            // ... but we DO have data
            newData.length > 0
          ) {
            // ... then build the column definitions from the data that we have
            self.grid.buildColumnDefsFromData(newData);
          }

          // If we haven't built columns before and either have some columns defined or some data defined
          if (!hasColumns && (self.grid.options.columnDefs.length > 0 || newData.length > 0)) {
            // Build the column set, then pre-compile the column cell templates
            promises.push(self.grid.buildColumns()
              .then(function() {
                self.grid.preCompileCellTemplates();
              }).catch(function(err) { $log.error(err); }));
          }

          $q.all(promises).then(function() {
            // use most recent data, rather than the potentially outdated data passed into watcher handler
            self.grid.modifyRows(mostRecentData)
              .then(function () {
                // if (self.viewport) {
                  self.grid.redrawInPlace(true);
                // }

                $scope.$evalAsync(function() {
                  self.grid.refreshCanvas(true);
                  self.grid.callDataChangeCallbacks(uiGridConstants.dataChange.ROW);
                });
              }).catch(function(err) { $log.error(err); });
          }).catch(function(err) { $log.error(err); });
        }
      }

      var styleWatchDereg = $scope.$watch(function () { return self.grid.styleComputations; }, function() {
        self.grid.refreshCanvas(true);
      });

      $scope.$on('$destroy', function() {
        deregFunctions.forEach( function( deregFn ) { deregFn(); });
        styleWatchDereg();
      });

      self.fireEvent = function(eventName, args) {
        args = args || {};

        // Add the grid to the event arguments if it's not there
        if (angular.isUndefined(args.grid)) {
          args.grid = self.grid;
        }

        $scope.$broadcast(eventName, args);
      };

      self.innerCompile = function innerCompile(elm) {
        $compile(elm)($scope);
      };
    }]);

/**
 *  @ngdoc directive
 *  @name ui.grid.directive:uiGrid
 *  @element div
 *  @restrict EA
 *  @param {Object} uiGrid Options for the grid to use
 *
 *  @description Create a very basic grid.
 *
 *  @example
    <example module="app">
      <file name="app.js">
        var app = angular.module('app', ['ui.grid']);

        app.controller('MainCtrl', ['$scope', function ($scope) {
          $scope.data = [
            { name: 'Bob', title: 'CEO' },
            { name: 'Frank', title: 'Lowly Developer' }
          ];
        }]);
      </file>
      <file name="index.html">
        <div ng-controller="MainCtrl">
          <div ui-grid="{ data: data }"></div>
        </div>
      </file>
    </example>
 */
angular.module('ui.grid').directive('uiGrid', uiGridDirective);

uiGridDirective.$inject = ['$window', 'gridUtil', 'uiGridConstants'];
function uiGridDirective($window, gridUtil, uiGridConstants) {
  return {
    templateUrl: 'ui-grid/ui-grid',
    scope: {
      uiGrid: '='
    },
    replace: true,
    transclude: true,
    controller: 'uiGridController',
    compile: function () {
      return {
        post: function ($scope, $elm, $attrs, uiGridCtrl) {
          var grid = uiGridCtrl.grid;
          // Initialize scrollbars (TODO: move to controller??)
          uiGridCtrl.scrollbars = [];
          grid.element = $elm;


          // See if the grid has a rendered width, if not, wait a bit and try again
          var sizeCheckInterval = 100; // ms
          var maxSizeChecks = 20; // 2 seconds total
          var sizeChecks = 0;

          // Setup (event listeners) the grid
          setup();

          // And initialize it
          init();

          // Mark rendering complete so API events can happen
          grid.renderingComplete();

          // If the grid doesn't have size currently, wait for a bit to see if it gets size
          checkSize();

          /*-- Methods --*/

          function checkSize() {
            // If the grid has no width and we haven't checked more than <maxSizeChecks> times, check again in <sizeCheckInterval> milliseconds
            if ($elm[0].offsetWidth <= 0 && sizeChecks < maxSizeChecks) {
              setTimeout(checkSize, sizeCheckInterval);
              sizeChecks++;
            } else {
              $scope.$applyAsync(init);
            }
          }

          // Setup event listeners and watchers
          function setup() {
            var deregisterLeftWatcher, deregisterRightWatcher;

            // Bind to window resize events
            angular.element($window).on('resize', gridResize);

            // Unbind from window resize events when the grid is destroyed
            $elm.on('$destroy', function () {
              angular.element($window).off('resize', gridResize);
              deregisterLeftWatcher();
              deregisterRightWatcher();
            });

            // If we add a left container after render, we need to watch and react
            deregisterLeftWatcher = $scope.$watch(function () { return grid.hasLeftContainer();}, function (newValue, oldValue) {
              if (newValue === oldValue) {
                return;
              }
              grid.refreshCanvas(true);
            });

            // If we add a right container after render, we need to watch and react
            deregisterRightWatcher = $scope.$watch(function () { return grid.hasRightContainer();}, function (newValue, oldValue) {
              if (newValue === oldValue) {
                return;
              }
              grid.refreshCanvas(true);
            });
          }

          // Initialize the directive
          function init() {
            grid.gridWidth = $scope.gridWidth = gridUtil.elementWidth($elm);

            // Default canvasWidth to the grid width, in case we don't get any column definitions to calculate it from
            grid.canvasWidth = uiGridCtrl.grid.gridWidth;

            grid.gridHeight = $scope.gridHeight = gridUtil.elementHeight($elm);

            // If the grid isn't tall enough to fit a single row, it's kind of useless. Resize it to fit a minimum number of rows
            if (grid.gridHeight - grid.scrollbarHeight <= grid.options.rowHeight && grid.options.enableMinHeightCheck) {
              autoAdjustHeight();
            }

            // Run initial canvas refresh
            grid.refreshCanvas(true);
          }

          // Set the grid's height ourselves in the case that its height would be unusably small
          function autoAdjustHeight() {
            // Figure out the new height
            var contentHeight = grid.options.minRowsToShow * grid.options.rowHeight;
            var headerHeight = grid.options.showHeader ? grid.options.headerRowHeight : 0;
            var footerHeight = grid.calcFooterHeight();

            var scrollbarHeight = 0;
            if (grid.options.enableHorizontalScrollbar === uiGridConstants.scrollbars.ALWAYS) {
              scrollbarHeight = gridUtil.getScrollbarWidth();
            }

            var maxNumberOfFilters = 0;
            // Calculates the maximum number of filters in the columns
            angular.forEach(grid.options.columnDefs, function(col) {
              if (col.hasOwnProperty('filter')) {
                if (maxNumberOfFilters < 1) {
                    maxNumberOfFilters = 1;
                }
              }
              else if (col.hasOwnProperty('filters')) {
                if (maxNumberOfFilters < col.filters.length) {
                    maxNumberOfFilters = col.filters.length;
                }
              }
            });

            if (grid.options.enableFiltering  && !maxNumberOfFilters) {
              var allColumnsHaveFilteringTurnedOff = grid.options.columnDefs.length && grid.options.columnDefs.every(function(col) {
                return col.enableFiltering === false;
              });

              if (!allColumnsHaveFilteringTurnedOff) {
                maxNumberOfFilters = 1;
              }
            }

            var filterHeight = maxNumberOfFilters * headerHeight;

            var newHeight = headerHeight + contentHeight + footerHeight + scrollbarHeight + filterHeight;

            $elm.css('height', newHeight + 'px');

            grid.gridHeight = $scope.gridHeight = gridUtil.elementHeight($elm);
          }

          // Resize the grid on window resize events
          function gridResize() {
            if (!gridUtil.isVisible($elm)) {
              return;
            }
            grid.gridWidth = $scope.gridWidth = gridUtil.elementWidth($elm);
            grid.gridHeight = $scope.gridHeight = gridUtil.elementHeight($elm);

            grid.refreshCanvas(true);
          }
        }
      };
    }
  };
}
})();

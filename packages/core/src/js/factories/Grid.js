(function() {

angular.module('ui.grid')
.factory('Grid', ['$q', '$compile', '$parse', 'gridUtil', 'uiGridConstants', 'GridOptions', 'GridColumn', 'GridRow', 'GridApi', 'rowSorter', 'rowSearcher', 'GridRenderContainer', '$timeout','ScrollEvent',
    function($q, $compile, $parse, gridUtil, uiGridConstants, GridOptions, GridColumn, GridRow, GridApi, rowSorter, rowSearcher, GridRenderContainer, $timeout, ScrollEvent) {

  /**
   * @ngdoc object
   * @name ui.grid.api:PublicApi
   * @description Public Api for the core grid features
   *
   */

  /**
   * @ngdoc function
   * @name ui.grid.class:Grid
   * @description Grid is the main viewModel.  Any properties or methods needed to maintain state are defined in
   * this prototype.  One instance of Grid is created per Grid directive instance.
   * @param {object} options Object map of options to pass into the grid. An 'id' property is expected.
   */
  var Grid = function Grid(options) {
    var self = this;
    // Get the id out of the options, then remove it
    if (options !== undefined && typeof(options.id) !== 'undefined' && options.id) {
      if (!/^[_a-zA-Z0-9-]+$/.test(options.id)) {
        throw new Error("Grid id '" + options.id + '" is invalid. It must follow CSS selector syntax rules.');
      }
    }
    else {
      throw new Error('No ID provided. An ID must be given when creating a grid.');
    }

    self.id = options.id;
    delete options.id;

    // Get default options
    self.options = GridOptions.initialize( options );

    /**
     * @ngdoc object
     * @name appScope
     * @propertyOf ui.grid.class:Grid
     * @description reference to the application scope (the parent scope of the ui-grid element).  Assigned in ui-grid controller
     * <br/>
     * use gridOptions.appScopeProvider to override the default assignment of $scope.$parent with any reference
     */
    self.appScope = self.options.appScopeProvider;

    self.headerHeight = self.options.headerRowHeight;


    /**
     * @ngdoc object
     * @name footerHeight
     * @propertyOf ui.grid.class:Grid
     * @description returns the total footer height gridFooter + columnFooter
     */
    self.footerHeight = self.calcFooterHeight();


    /**
     * @ngdoc object
     * @name columnFooterHeight
     * @propertyOf ui.grid.class:Grid
     * @description returns the total column footer height
     */
    self.columnFooterHeight = self.calcColumnFooterHeight();

    self.rtl = false;
    self.gridHeight = 0;
    self.gridWidth = 0;
    self.columnBuilders = [];
    self.rowBuilders = [];
    self.rowsProcessors = [];
    self.columnsProcessors = [];
    self.styleComputations = [];
    self.viewportAdjusters = [];
    self.rowHeaderColumns = [];
    self.dataChangeCallbacks = {};
    self.verticalScrollSyncCallBackFns = {};
    self.horizontalScrollSyncCallBackFns = {};

    // self.visibleRowCache = [];

    // Set of 'render' containers for self grid, which can render sets of rows
    self.renderContainers = {};

    // Create a
    self.renderContainers.body = new GridRenderContainer('body', self);

    self.cellValueGetterCache = {};

    // Cached function to use with custom row templates
    self.getRowTemplateFn = null;


    // representation of the rows on the grid.
    // these are wrapped references to the actual data rows (options.data)
    self.rows = [];

    // represents the columns on the grid
    self.columns = [];

    /**
     * @ngdoc boolean
     * @name isScrollingVertically
     * @propertyOf ui.grid.class:Grid
     * @description set to true when Grid is scrolling vertically. Set to false via debounced method
     */
    self.isScrollingVertically = false;

    /**
     * @ngdoc boolean
     * @name isScrollingHorizontally
     * @propertyOf ui.grid.class:Grid
     * @description set to true when Grid is scrolling horizontally. Set to false via debounced method
     */
    self.isScrollingHorizontally = false;

    /**
     * @ngdoc property
     * @name scrollDirection
     * @propertyOf ui.grid.class:Grid
     * @description set one of the {@link ui.grid.service:uiGridConstants#properties_scrollDirection uiGridConstants.scrollDirection}
     *  values (UP, DOWN, LEFT, RIGHT, NONE), which tells us which direction we are scrolling.
     * Set to NONE via debounced method
     */
    self.scrollDirection = uiGridConstants.scrollDirection.NONE;

    // if true, grid will not respond to any scroll events
    self.disableScrolling = false;


    function vertical (scrollEvent) {
      self.isScrollingVertically = false;
      self.api.core.raise.scrollEnd(scrollEvent);
      self.scrollDirection = uiGridConstants.scrollDirection.NONE;
    }

    var debouncedVertical = gridUtil.debounce(vertical, self.options.scrollDebounce);
    var debouncedVerticalMinDelay = gridUtil.debounce(vertical, 0);

    function horizontal (scrollEvent) {
      self.isScrollingHorizontally = false;
      self.api.core.raise.scrollEnd(scrollEvent);
      self.scrollDirection = uiGridConstants.scrollDirection.NONE;
    }

    var debouncedHorizontal = gridUtil.debounce(horizontal, self.options.scrollDebounce);
    var debouncedHorizontalMinDelay = gridUtil.debounce(horizontal, 0);


    /**
     * @ngdoc function
     * @name flagScrollingVertically
     * @methodOf ui.grid.class:Grid
     * @description sets isScrollingVertically to true and sets it to false in a debounced function
     */
    self.flagScrollingVertically = function(scrollEvent) {
      if (!self.isScrollingVertically && !self.isScrollingHorizontally) {
        self.api.core.raise.scrollBegin(scrollEvent);
      }
      self.isScrollingVertically = true;
      if (self.options.scrollDebounce === 0 || !scrollEvent.withDelay) {
        debouncedVerticalMinDelay(scrollEvent);
      }
      else {
        debouncedVertical(scrollEvent);
      }
    };

    /**
     * @ngdoc function
     * @name flagScrollingHorizontally
     * @methodOf ui.grid.class:Grid
     * @description sets isScrollingHorizontally to true and sets it to false in a debounced function
     */
    self.flagScrollingHorizontally = function(scrollEvent) {
      if (!self.isScrollingVertically && !self.isScrollingHorizontally) {
        self.api.core.raise.scrollBegin(scrollEvent);
      }
      self.isScrollingHorizontally = true;
      if (self.options.scrollDebounce === 0 || !scrollEvent.withDelay) {
        debouncedHorizontalMinDelay(scrollEvent);
      }
      else {
        debouncedHorizontal(scrollEvent);
      }
    };

    self.scrollbarHeight = 0;
    self.scrollbarWidth = 0;
    if (self.options.enableHorizontalScrollbar !== uiGridConstants.scrollbars.NEVER) {
      self.scrollbarHeight = gridUtil.getScrollbarWidth();
    }

    if (self.options.enableVerticalScrollbar !== uiGridConstants.scrollbars.NEVER) {
      self.scrollbarWidth = gridUtil.getScrollbarWidth();
    }

    self.api = new GridApi(self);

    /**
     * @ngdoc function
     * @name refresh
     * @methodOf ui.grid.api:PublicApi
     * @description Refresh the rendered grid on screen.
     * The refresh method re-runs both the columnProcessors and the
     * rowProcessors, as well as calling refreshCanvas to update all
     * the grid sizing.  In general you should prefer to use queueGridRefresh
     * instead, which is basically a debounced version of refresh.
     *
     * If you only want to resize the grid, not regenerate all the rows
     * and columns, you should consider directly calling refreshCanvas instead.
     *
     * @param {boolean} [rowsAltered] Optional flag for refreshing when the number of rows has changed
     */
    self.api.registerMethod( 'core', 'refresh', this.refresh );

    /**
     * @ngdoc function
     * @name queueGridRefresh
     * @methodOf ui.grid.api:PublicApi
     * @description Request a refresh of the rendered grid on screen, if multiple
     * calls to queueGridRefresh are made within a digest cycle only one will execute.
     * The refresh method re-runs both the columnProcessors and the
     * rowProcessors, as well as calling refreshCanvas to update all
     * the grid sizing.  In general you should prefer to use queueGridRefresh
     * instead, which is basically a debounced version of refresh.
     *
     */
    self.api.registerMethod( 'core', 'queueGridRefresh', this.queueGridRefresh );

    /**
     * @ngdoc function
     * @name refreshRows
     * @methodOf ui.grid.api:PublicApi
     * @description Runs only the rowProcessors, columns remain as they were.
     * It then calls redrawInPlace and refreshCanvas, which adjust the grid sizing.
     * @returns {promise} promise that is resolved when render completes?
     *
     */
    self.api.registerMethod( 'core', 'refreshRows', this.refreshRows );

    /**
     * @ngdoc function
     * @name queueRefresh
     * @methodOf ui.grid.api:PublicApi
     * @description Requests execution of refreshCanvas, if multiple requests are made
     * during a digest cycle only one will run.  RefreshCanvas updates the grid sizing.
     * @returns {promise} promise that is resolved when render completes?
     *
     */
    self.api.registerMethod( 'core', 'queueRefresh', this.queueRefresh );

    /**
     * @ngdoc function
     * @name handleWindowResize
     * @methodOf ui.grid.api:PublicApi
     * @description Trigger a grid resize, normally this would be picked
     * up by a watch on window size, but in some circumstances it is necessary
     * to call this manually
     * @returns {promise} promise that is resolved when render completes?
     *
     */
    self.api.registerMethod( 'core', 'handleWindowResize', this.handleWindowResize );


    /**
     * @ngdoc function
     * @name addRowHeaderColumn
     * @methodOf ui.grid.api:PublicApi
     * @description adds a row header column to the grid
     * @param {object} column def
     * @param {number} order Determines order of header column on grid.  Lower order means header
     * is positioned to the left of higher order headers
     *
     */
    self.api.registerMethod( 'core', 'addRowHeaderColumn', this.addRowHeaderColumn );

    /**
     * @ngdoc function
     * @name scrollToIfNecessary
     * @methodOf ui.grid.api:PublicApi
     * @description Scrolls the grid to make a certain row and column combo visible,
     *   in the case that it is not completely visible on the screen already.
     * @param {GridRow} gridRow row to make visible
     * @param {GridColumn} gridCol column to make visible
     * @returns {promise} a promise that is resolved when scrolling is complete
     *
     */
    self.api.registerMethod( 'core', 'scrollToIfNecessary', function(gridRow, gridCol) { return self.scrollToIfNecessary(gridRow, gridCol);} );

    /**
     * @ngdoc function
     * @name scrollTo
     * @methodOf ui.grid.api:PublicApi
     * @description Scroll the grid such that the specified
     * row and column is in view
     * @param {object} rowEntity gridOptions.data[] array instance to make visible
     * @param {object} colDef to make visible
     * @returns {promise} a promise that is resolved after any scrolling is finished
     */
    self.api.registerMethod( 'core', 'scrollTo', function (rowEntity, colDef) { return self.scrollTo(rowEntity, colDef);}  );

    /**
     * @ngdoc function
     * @name registerRowsProcessor
     * @methodOf ui.grid.api:PublicApi
     * @description
     * Register a "rows processor" function. When the rows are updated,
     * the grid calls each registered "rows processor", which has a chance
     * to alter the set of rows (sorting, etc) as long as the count is not
     * modified.
     *
     * @param {function(renderedRowsToProcess, columns )} processorFunction rows processor function, which
     * is run in the context of the grid (i.e. this for the function will be the grid), and must
     * return the updated rows list, which is passed to the next processor in the chain
     * @param {number} priority the priority of this processor.  In general we try to do them in 100s to leave room
     * for other people to inject rows processors at intermediate priorities.  Lower priority rowsProcessors run earlier.
     *
     * At present allRowsVisible is running at 50, sort manipulations running at 60-65, filter is running at 100,
     * sort is at 200, grouping and treeview at 400-410, selectable rows at 500, pagination at 900 (pagination will generally want to be last)
     */
    self.api.registerMethod( 'core', 'registerRowsProcessor', this.registerRowsProcessor  );

    /**
     * @ngdoc function
     * @name registerColumnsProcessor
     * @methodOf ui.grid.api:PublicApi
     * @description
     * Register a "columns processor" function. When the columns are updated,
     * the grid calls each registered "columns processor", which has a chance
     * to alter the set of columns as long as the count is not
     * modified.
     *
     * @param {function(renderedColumnsToProcess, rows )} processorFunction columns processor function, which
     * is run in the context of the grid (i.e. this for the function will be the grid), and must
     * return the updated columns list, which is passed to the next processor in the chain
     * @param {number} priority the priority of this processor.  In general we try to do them in 100s to leave room
     * for other people to inject columns processors at intermediate priorities.  Lower priority columnsProcessors run earlier.
     *
     * At present allRowsVisible is running at 50, filter is running at 100, sort is at 200, grouping at 400, selectable rows at 500, pagination at 900 (pagination will generally want to be last)
     */
    self.api.registerMethod( 'core', 'registerColumnsProcessor', this.registerColumnsProcessor  );

    /**
     * @ngdoc function
     * @name sortHandleNulls
     * @methodOf ui.grid.api:PublicApi
     * @description A null handling method that can be used when building custom sort
     * functions
     * @example
     * <pre>
     *   mySortFn = function(a, b) {
     *   var nulls = $scope.gridApi.core.sortHandleNulls(a, b);
     *   if ( nulls !== null ) {
     *     return nulls;
     *   } else {
     *     // your code for sorting here
     *   };
     * </pre>
     * @param {object} a sort value a
     * @param {object} b sort value b
     * @returns {number} null if there were no nulls/undefineds, otherwise returns
     * a sort value that should be passed back from the sort function
     *
     */
    self.api.registerMethod( 'core', 'sortHandleNulls', rowSorter.handleNulls );

    /**
     * @ngdoc function
     * @name sortChanged
     * @methodOf  ui.grid.api:PublicApi
     * @description The sort criteria on one or more columns has
     * changed.  Provides as parameters the grid and the output of
     * getColumnSorting, which is an array of gridColumns
     * that have sorting on them, sorted in priority order.
     *
     * @param {$scope} scope The scope of the controller. This is used to deregister this event when the scope is destroyed.
     * @param {Function} callBack Will be called when the event is emited. The function passes back the grid and an array of
     * columns with sorts on them, in priority order.
     *
     * @example
     * <pre>
     *      gridApi.core.on.sortChanged( $scope, function(grid, sortColumns) {
     *        // do something
     *      });
     * </pre>
     */
    self.api.registerEvent( 'core', 'sortChanged' );

      /**
     * @ngdoc function
     * @name columnVisibilityChanged
     * @methodOf  ui.grid.api:PublicApi
     * @description The visibility of a column has changed,
     * the column itself is passed out as a parameter of the event.
     *
     * @param {$scope} scope The scope of the controller. This is used to deregister this event when the scope is destroyed.
     * @param {Function} callBack Will be called when the event is emited. The function passes back the GridCol that has changed.
     *
     * @example
     * <pre>
     *      gridApi.core.on.columnVisibilityChanged( $scope, function (column) {
     *        // do something
     *      } );
     * </pre>
     */
    self.api.registerEvent( 'core', 'columnVisibilityChanged' );

    /**
     * @ngdoc method
     * @name notifyDataChange
     * @methodOf ui.grid.api:PublicApi
     * @description Notify the grid that a data or config change has occurred,
     * where that change isn't something the grid was otherwise noticing.  This
     * might be particularly relevant where you've changed values within the data
     * and you'd like cell classes to be re-evaluated, or changed config within
     * the columnDef and you'd like headerCellClasses to be re-evaluated.
     * @param {string} type one of the
     * {@link ui.grid.service:uiGridConstants#properties_dataChange uiGridConstants.dataChange}
     * values (ALL, ROW, EDIT, COLUMN, OPTIONS), which tells us which refreshes to fire.
     *
     * - ALL: listeners fired on any of these events, fires listeners on all events.
     * - ROW: fired when a row is added or removed.
     * - EDIT: fired when the data in a cell is edited.
     * - COLUMN: fired when the column definitions are modified.
     * - OPTIONS: fired when the grid options are modified.
     */
    self.api.registerMethod( 'core', 'notifyDataChange', this.notifyDataChange );

    /**
     * @ngdoc method
     * @name clearAllFilters
     * @methodOf ui.grid.api:PublicApi
     * @description Clears all filters and optionally refreshes the visible rows.
     * @param {object} refreshRows Defaults to true.
     * @param {object} clearConditions Defaults to false.
     * @param {object} clearFlags Defaults to false.
     * @returns {promise} If `refreshRows` is true, returns a promise of the rows refreshing.
     */
    self.api.registerMethod('core', 'clearAllFilters', this.clearAllFilters);

    self.registerDataChangeCallback( self.columnRefreshCallback, [uiGridConstants.dataChange.COLUMN]);
    self.registerDataChangeCallback( self.processRowsCallback, [uiGridConstants.dataChange.EDIT]);
    self.registerDataChangeCallback( self.updateFooterHeightCallback, [uiGridConstants.dataChange.OPTIONS]);

    self.registerStyleComputation({
      priority: 10,
      func: self.getFooterStyles
    });
  };

   Grid.prototype.calcFooterHeight = function () {
     if (!this.hasFooter()) {
       return 0;
     }

     var height = 0;
     if (this.options.showGridFooter) {
       height += this.options.gridFooterHeight;
     }

     height += this.calcColumnFooterHeight();

     return height;
   };

   Grid.prototype.calcColumnFooterHeight = function () {
     var height = 0;

     if (this.options.showColumnFooter) {
       height += this.options.columnFooterHeight;
     }

     return height;
   };

   Grid.prototype.getFooterStyles = function () {
     var style = '.grid' + this.id + ' .ui-grid-footer-aggregates-row { height: ' + this.options.columnFooterHeight + 'px; }';
     style += ' .grid' + this.id + ' .ui-grid-footer-info { height: ' + this.options.gridFooterHeight + 'px; }';
     return style;
   };

  Grid.prototype.hasFooter = function () {
   return this.options.showGridFooter || this.options.showColumnFooter;
  };

  /**
   * @ngdoc function
   * @name isRTL
   * @methodOf ui.grid.class:Grid
   * @description Returns true if grid is RightToLeft
   */
  Grid.prototype.isRTL = function () {
    return this.rtl;
  };


  /**
   * @ngdoc function
   * @name registerColumnBuilder
   * @methodOf ui.grid.class:Grid
   * @description When the build creates columns from column definitions, the columnbuilders will be called to add
   * additional properties to the column.
   * @param {function(colDef, col, gridOptions)} columnBuilder function to be called
   */
  Grid.prototype.registerColumnBuilder = function registerColumnBuilder(columnBuilder) {
    this.columnBuilders.push(columnBuilder);
  };

  /**
   * @ngdoc function
   * @name buildColumnDefsFromData
   * @methodOf ui.grid.class:Grid
   * @description Populates columnDefs from the provided data
   * @param {function(colDef, col, gridOptions)} rowBuilder function to be called
   */
  Grid.prototype.buildColumnDefsFromData = function (dataRows) {
    this.options.columnDefs =  gridUtil.getColumnsFromData(dataRows, this.options.excludeProperties);
  };

  /**
   * @ngdoc function
   * @name registerRowBuilder
   * @methodOf ui.grid.class:Grid
   * @description When the build creates rows from gridOptions.data, the rowBuilders will be called to add
   * additional properties to the row.
   * @param {function(row, gridOptions)} rowBuilder function to be called
   */
  Grid.prototype.registerRowBuilder = function registerRowBuilder(rowBuilder) {
    this.rowBuilders.push(rowBuilder);
  };

  /**
   * @ngdoc function
   * @name registerDataChangeCallback
   * @methodOf ui.grid.class:Grid
   * @description When a data change occurs, the data change callbacks of the specified type
   * will be called.  The rules are:
   *
   * - when the data watch fires, that is considered a ROW change (the data watch only notices
   *   added or removed rows)
   * - when the api is called to inform us of a change, the declared type of that change is used
   * - when a cell edit completes, the EDIT callbacks are triggered
   * - when the columnDef watch fires, the COLUMN callbacks are triggered
   * - when the options watch fires, the OPTIONS callbacks are triggered
   *
   * For a given event:
   * - ALL calls ROW, EDIT, COLUMN, OPTIONS and ALL callbacks
   * - ROW calls ROW and ALL callbacks
   * - EDIT calls EDIT and ALL callbacks
   * - COLUMN calls COLUMN and ALL callbacks
   * - OPTIONS calls OPTIONS and ALL callbacks
   *
   * @param {function(grid)} callback function to be called
   * @param {array} types the types of data change you want to be informed of.  Values from
   * the {@link ui.grid.service:uiGridConstants#properties_dataChange uiGridConstants.dataChange}
   *  values ( ALL, EDIT, ROW, COLUMN, OPTIONS ).  Optional and defaults to ALL
   * @returns {function} deregister function - a function that can be called to deregister this callback
   */
  Grid.prototype.registerDataChangeCallback = function registerDataChangeCallback(callback, types, _this) {
    var self = this,
      uid = gridUtil.nextUid();

    if ( !types ) {
      types = [uiGridConstants.dataChange.ALL];
    }
    if ( !Array.isArray(types)) {
      gridUtil.logError("Expected types to be an array or null in registerDataChangeCallback, value passed was: " + types );
    }
    this.dataChangeCallbacks[uid] = { callback: callback, types: types, _this: _this };

    return function() {
      delete self.dataChangeCallbacks[uid];
    };
  };

  /**
   * @ngdoc function
   * @name callDataChangeCallbacks
   * @methodOf ui.grid.class:Grid
   * @description Calls the callbacks based on the type of data change that
   * has occurred. Always calls the ALL callbacks, calls the ROW, EDIT, COLUMN and OPTIONS callbacks if the
   * event type is matching, or if the type is ALL.
   * @param {string} type the type of event that occurred - one of the
   * {@link ui.grid.service:uiGridConstants#properties_dataChange uiGridConstants.dataChange}
   *  values (ALL, ROW, EDIT, COLUMN, OPTIONS)
   */
  Grid.prototype.callDataChangeCallbacks = function callDataChangeCallbacks(type, options) {
    angular.forEach( this.dataChangeCallbacks, function( callback, uid ) {
      if ( callback.types.indexOf( uiGridConstants.dataChange.ALL ) !== -1 ||
           callback.types.indexOf( type ) !== -1 ||
           type === uiGridConstants.dataChange.ALL ) {
        if (callback._this) {
           callback.callback.apply(callback._this, this, options);
        }
        else {
          callback.callback(this, options);
        }
      }
    }, this);
  };

  /**
   * @ngdoc function
   * @name notifyDataChange
   * @methodOf ui.grid.class:Grid
   * @description Notifies us that a data change has occurred, used in the public
   * api for users to tell us when they've changed data or some other event that
   * our watches cannot pick up
   * @param {string} type the type of event that occurred - one of the
   * uiGridConstants.dataChange values (ALL, ROW, EDIT, COLUMN, OPTIONS)
   *
   * - ALL: listeners fired on any of these events, fires listeners on all events.
   * - ROW: fired when a row is added or removed.
   * - EDIT: fired when the data in a cell is edited.
   * - COLUMN: fired when the column definitions are modified.
   * - OPTIONS: fired when the grid options are modified.
   */
  Grid.prototype.notifyDataChange = function notifyDataChange(type) {
    var constants = uiGridConstants.dataChange;

    if ( type === constants.ALL ||
         type === constants.COLUMN ||
         type === constants.EDIT ||
         type === constants.ROW ||
         type === constants.OPTIONS ) {
      this.callDataChangeCallbacks( type );
    }
    else {
      gridUtil.logError("Notified of a data change, but the type was not recognised, so no action taken, type was: " + type);
    }
  };

  /**
   * @ngdoc function
   * @name columnRefreshCallback
   * @methodOf ui.grid.class:Grid
   * @description refreshes the grid when a column refresh
   * is notified, which triggers handling of the visible flag.
   * This is called on uiGridConstants.dataChange.COLUMN, and is
   * registered as a dataChangeCallback in grid.js
   * @param {object} grid The grid object.
   * @param {object} options Any options passed into the callback.
   */
  Grid.prototype.columnRefreshCallback = function columnRefreshCallback(grid, options) {
    grid.buildColumns(options);
    grid.queueGridRefresh();
  };

  /**
   * @ngdoc function
   * @name processRowsCallback
   * @methodOf ui.grid.class:Grid
   * @description calls the row processors, specifically
   * intended to reset the sorting when an edit is called,
   * registered as a dataChangeCallback on uiGridConstants.dataChange.EDIT
   * @param {object} grid The grid object.
   */
  Grid.prototype.processRowsCallback = function processRowsCallback( grid ) {
    grid.queueGridRefresh();
  };


  /**
   * @ngdoc function
   * @name updateFooterHeightCallback
   * @methodOf ui.grid.class:Grid
   * @description recalculates the footer height,
   * registered as a dataChangeCallback on uiGridConstants.dataChange.OPTIONS
   * @param {object} grid The grid object.
   */
  Grid.prototype.updateFooterHeightCallback = function updateFooterHeightCallback( grid ) {
    grid.footerHeight = grid.calcFooterHeight();
    grid.columnFooterHeight = grid.calcColumnFooterHeight();
  };


  /**
   * @ngdoc function
   * @name getColumn
   * @methodOf ui.grid.class:Grid
   * @description returns a grid column for the column name
   * @param {string} name column name
   */
  Grid.prototype.getColumn = function getColumn(name) {
    return rowColumnFinder(this.columns, function (column) {
      return column.colDef.name === name;
    });
  };

  /**
   * @ngdoc function
   * @name getColDef
   * @methodOf ui.grid.class:Grid
   * @description returns a grid colDef for the column name
   * @param {string} name column.field
   */
  Grid.prototype.getColDef = function getColDef(name) {
    return rowColumnFinder(this.options.columnDefs, function (colDef) {
      return colDef.name === name;
    });
  };

  /**
   * @ngdoc function
   * @name assignTypes
   * @methodOf ui.grid.class:Grid
   * @description uses the first row of data to assign colDef.type for any types not defined.
   */
  /**
   * @ngdoc property
   * @name type
   * @propertyOf ui.grid.class:GridOptions.columnDef
   * @description the type of the column, used in sorting.  If not provided then the
   * grid will guess the type.  Add this only if the grid guessing is not to your
   * satisfaction.  One of:
   * - 'string'
   * - 'boolean'
   * - 'number'
   * - 'date'
   * - 'object'
   * - 'numberStr'
   * Note that if you choose date, your dates should be in a javascript date type
   *
   */
  Grid.prototype.assignTypes = function() {
    var self = this;

    self.options.columnDefs.forEach(function (colDef, index) {
      // Assign colDef type if not specified
      if (!colDef.type) {
        var col = new GridColumn(colDef, index, self);
        var firstRow = self.rows.length > 0 ? self.rows[0] : null;
        if (firstRow) {
          colDef.type = gridUtil.guessType(self.getCellValue(firstRow, col));
        }
        else {
          colDef.type = 'string';
        }
      }
    });
  };


  /**
   * @ngdoc function
   * @name isRowHeaderColumn
   * @methodOf ui.grid.class:Grid
   * @description returns true if the column is a row Header
   * @param {object} column column
   */
  Grid.prototype.isRowHeaderColumn = function isRowHeaderColumn(column) {
    return this.rowHeaderColumns.indexOf(column) !== -1;
  };

  /**
  * @ngdoc function
  * @name addRowHeaderColumn
  * @methodOf ui.grid.class:Grid
  * @description adds a row header column to the grid
  * @param {object} colDef Column definition object.
  * @param {float} order Number that indicates where the column should be placed in the grid.
  * @param {boolean} stopColumnBuild Prevents the buildColumn callback from being triggered. This is useful to improve
  * performance of the grid during initial load.
  */
  Grid.prototype.addRowHeaderColumn = function addRowHeaderColumn(colDef, order, stopColumnBuild) {
    var self = this;

    // default order
    if (order === undefined) {
      order = 0;
    }

    var rowHeaderCol = new GridColumn(colDef, gridUtil.nextUid(), self);
    rowHeaderCol.isRowHeader = true;
    if (self.isRTL()) {
      self.createRightContainer();
      rowHeaderCol.renderContainer = 'right';
    }
    else {
      self.createLeftContainer();
      rowHeaderCol.renderContainer = 'left';
    }

    // relies on the default column builder being first in array, as it is instantiated
    // as part of grid creation
    self.columnBuilders[0](colDef,rowHeaderCol,self.options)
      .then(function() {
        rowHeaderCol.enableFiltering = false;
        rowHeaderCol.enableSorting = false;
        rowHeaderCol.enableHiding = false;
        rowHeaderCol.headerPriority = order;
        self.rowHeaderColumns.push(rowHeaderCol);
        self.rowHeaderColumns = self.rowHeaderColumns.sort(function (a, b) {
          return a.headerPriority - b.headerPriority;
        });

        if (!stopColumnBuild) {
          self.buildColumns()
            .then(function() {
              self.preCompileCellTemplates();
              self.queueGridRefresh();
            }).catch(function(err) { $log.error(err); });
        }
      }).catch(function(err) { $log.error(err); });
  };

  /**
   * @ngdoc function
   * @name getOnlyDataColumns
   * @methodOf ui.grid.class:Grid
   * @description returns all columns except for rowHeader columns
   */
  Grid.prototype.getOnlyDataColumns = function getOnlyDataColumns() {
    var self = this,
      cols = [];

    self.columns.forEach(function (col) {
      if (self.rowHeaderColumns.indexOf(col) === -1) {
        cols.push(col);
      }
    });
    return cols;
  };

  /**
   * @ngdoc function
   * @name buildColumns
   * @methodOf ui.grid.class:Grid
   * @description creates GridColumn objects from the columnDefinition.  Calls each registered
   * columnBuilder to further process the column
   * @param {object} opts An object contains options to use when building columns
   *
   * * **orderByColumnDefs**: defaults to **false**. When true, `buildColumns` will reorder existing columns according to the order within the column definitions.
   *
   * @returns {Promise} a promise to load any needed column resources
   */
  Grid.prototype.buildColumns = function buildColumns(opts) {
    var options = {
      orderByColumnDefs: false
    };

    angular.extend(options, opts);

    // gridUtil.logDebug('buildColumns');
    var self = this;
    var builderPromises = [];
    var headerOffset = self.rowHeaderColumns.length;
    var i;

    // Remove any columns for which a columnDef cannot be found
    // Deliberately don't use forEach, as it doesn't like splice being called in the middle
    // Also don't cache columns.length, as it will change during this operation
    for (i = 0; i < self.columns.length; i++) {
      if (!self.getColDef(self.columns[i].name)) {
        self.columns.splice(i, 1);
        i--;
      }
    }

    // add row header columns to the grid columns array _after_ columns without columnDefs have been removed
    // rowHeaderColumns is ordered by priority so insert in reverse
    for (var j = self.rowHeaderColumns.length - 1; j >= 0; j--) {
      self.columns.unshift(self.rowHeaderColumns[j]);
    }

    // look at each column def, and update column properties to match.  If the column def
    // doesn't have a column, then splice in a new gridCol
    self.options.columnDefs.forEach(function (colDef, index) {
      self.preprocessColDef(colDef);
      var col = self.getColumn(colDef.name);

      if (!col) {
        col = new GridColumn(colDef, gridUtil.nextUid(), self);
        self.columns.splice(index + headerOffset, 0, col);
      }
      else {
        // tell updateColumnDef that the column was pre-existing
        col.updateColumnDef(colDef, false);
      }

      self.columnBuilders.forEach(function (builder) {
        builderPromises.push(builder.call(self, colDef, col, self.options));
      });
    });

    /*** Reorder columns if necessary ***/
    if (!!options.orderByColumnDefs) {
      // Create a shallow copy of the columns as a cache
      var columnCache = self.columns.slice(0);

      // We need to allow for the "row headers" when mapping from the column defs array to the columns array
      //   If we have a row header in columns[0] and don't account for it   we'll overwrite it with the column in columnDefs[0]

      // Go through all the column defs, use the shorter of columns length and colDefs.length because if a user has given two columns the same name then
      // columns will be shorter than columnDefs.  In this situation we'll avoid an error, but the user will still get an unexpected result
      var len = Math.min(self.options.columnDefs.length, self.columns.length);
      for (i = 0; i < len; i++) {
        // If the column at this index has a different name than the column at the same index in the column defs...
        if (self.columns[i + headerOffset].name !== self.options.columnDefs[i].name) {
          // Replace the one in the cache with the appropriate column
          columnCache[i + headerOffset] = self.getColumn(self.options.columnDefs[i].name);
        }
        else {
          // Otherwise just copy over the one from the initial columns
          columnCache[i + headerOffset] = self.columns[i + headerOffset];
        }
      }

      // Empty out the columns array, non-destructively
      self.columns.length = 0;

      // And splice in the updated, ordered columns from the cache
      Array.prototype.splice.apply(self.columns, [0, 0].concat(columnCache));
    }

    return $q.all(builderPromises).then(function() {
      if (self.rows.length > 0) {
        self.assignTypes();
      }
      if (options.preCompileCellTemplates) {
        self.preCompileCellTemplates();
      }
    }).catch(function(err) { $log.error(err); });
  };

  Grid.prototype.preCompileCellTemplate = function(col) {
    var self = this;
    var html = col.cellTemplate.replace(uiGridConstants.MODEL_COL_FIELD, self.getQualifiedColField(col));
    html = html.replace(uiGridConstants.COL_FIELD, 'grid.getCellValue(row, col)');

    col.compiledElementFn = $compile(html);

    if (col.compiledElementFnDefer) {
      col.compiledElementFnDefer.resolve(col.compiledElementFn);
    }
  };

/**
 * @ngdoc function
 * @name preCompileCellTemplates
 * @methodOf ui.grid.class:Grid
 * @description precompiles all cell templates
 */
  Grid.prototype.preCompileCellTemplates = function() {
    var self = this;
    self.columns.forEach(function (col) {
      if ( col.cellTemplate ) {
        self.preCompileCellTemplate( col );
      } else if ( col.cellTemplatePromise ) {
        col.cellTemplatePromise.then( function() {
          self.preCompileCellTemplate( col );
        }).catch(function(err) { $log.error(err); });
      }
    });
  };

  /**
   * @ngdoc function
   * @name getGridQualifiedColField
   * @methodOf ui.grid.class:Grid
   * @description Returns the $parse-able accessor for a column within its $scope
   * @param {GridColumn} col col object
   */
  Grid.prototype.getQualifiedColField = function (col) {
    var base = 'row.entity';
    if ( col.field === uiGridConstants.ENTITY_BINDING ) {
      return base;
    }
    return gridUtil.preEval(base + '.' + col.field);
  };

  /**
   * @ngdoc function
   * @name createLeftContainer
   * @methodOf ui.grid.class:Grid
   * @description creates the left render container if it doesn't already exist
   */
  Grid.prototype.createLeftContainer = function() {
    if (!this.hasLeftContainer()) {
      this.renderContainers.left = new GridRenderContainer('left', this, { disableColumnOffset: true });
    }
  };

  /**
   * @ngdoc function
   * @name createRightContainer
   * @methodOf ui.grid.class:Grid
   * @description creates the right render container if it doesn't already exist
   */
  Grid.prototype.createRightContainer = function() {
    if (!this.hasRightContainer()) {
      this.renderContainers.right = new GridRenderContainer('right', this, { disableColumnOffset: true });
    }
  };

  /**
   * @ngdoc function
   * @name hasLeftContainer
   * @methodOf ui.grid.class:Grid
   * @description returns true if leftContainer exists
   */
  Grid.prototype.hasLeftContainer = function() {
    return this.renderContainers.left !== undefined;
  };

  /**
   * @ngdoc function
   * @name hasRightContainer
   * @methodOf ui.grid.class:Grid
   * @description returns true if rightContainer exists
   */
  Grid.prototype.hasRightContainer = function() {
    return this.renderContainers.right !== undefined;
  };


      /**
   * undocumented function
   * @name preprocessColDef
   * @methodOf ui.grid.class:Grid
   * @description defaults the name property from field to maintain backwards compatibility with 2.x
   * validates that name or field is present
   */
  Grid.prototype.preprocessColDef = function preprocessColDef(colDef) {
    var self = this;

    if (!colDef.field && !colDef.name) {
      throw new Error('colDef.name or colDef.field property is required');
    }

    // maintain backwards compatibility with 2.x
    // field was required in 2.x.  now name is required
    if (colDef.name === undefined && colDef.field !== undefined) {
      // See if the column name already exists:
      var newName = colDef.field,
        counter = 2;
      while (self.getColumn(newName)) {
        newName = colDef.field + counter.toString();
        counter++;
      }
      colDef.name = newName;
    }
  };

  // Return a list of items that exist in the `n` array but not the `o` array. Uses optional property accessors passed as third & fourth parameters
  Grid.prototype.newInN = function newInN(o, n, oAccessor, nAccessor) {
    var self = this;

    var t = [];
    for (var i = 0; i < n.length; i++) {
      var nV = nAccessor ? n[i][nAccessor] : n[i];

      var found = false;
      for (var j = 0; j < o.length; j++) {
        var oV = oAccessor ? o[j][oAccessor] : o[j];
        if (self.options.rowEquality(nV, oV)) {
          found = true;
          break;
        }
      }
      if (!found) {
        t.push(nV);
      }
    }

    return t;
  };

  var rowColumnFinder = function(array, func) {
    if (array && array.length) {
      if (angular.isFunction(array.find)) {
        return array.find(func) || null;
      }

      var result = null;
      array.every(function (entry) {
        if (func(entry)) {
          result = entry;
          return false;
        }
        return true;
      });
      return result;
    }
    return null;
  }

  /**
   * @ngdoc function
   * @name getRow
   * @methodOf ui.grid.class:Grid
   * @description returns the GridRow that contains the rowEntity
   * @param {object} rowEntity the gridOptions.data array element instance
   * @param {array} lookInRows [optional] the rows to look in - if not provided then
   * looks in grid.rows
   */
  Grid.prototype.getRow = function getRow(rowEntity, lookInRows) {
    var self = this;
    lookInRows = lookInRows == void 0 ? this.rows : lookInRows;
    return rowColumnFinder(lookInRows, function (row) {
      return self.options.rowEquality(row.entity, rowEntity);
    });
  };

  /**
   * @ngdoc function
   * @name getRowsByKey
   * @methodOf ui.grid.class:Grid
   * @description returns all GridRows who have an key that is equal to comparator
   * so for Example if isInEntity == false then it does this check: row[key] === comparator
   * if isInEntity == true then it does this check: row.entity[key] === comparator
   * @param {boolean} isInEntity if true then key is in entity else it's directly in row
   * @param {(string|number)} key the key to look for
   * @param {any} comparator the value that key should have
   * @param {array} lookInRows [optional] the rows to look in - if not provided then
   * looks in grid.rows
   */
  Grid.prototype.getRowsByKey = function getRowsByKey(isInEntity, key, comparator, lookInRows) {
    if ( key == void 0 ) {
      return null;
    }

    lookInRows = lookInRows == void 0 ? this.rows : lookInRows;
    var func = isInEntity ? function (row) {
      return row.entity != void 0 && row.entity.hasOwnProperty(key) && row.entity[key] === comparator;
    } : function (row) {
      return row.hasOwnProperty(key) && row[key] === comparator;
    }

    return lookInRows.filter(func);
  };

  /**
   * @ngdoc function
   * @name findRowByKey
   * @methodOf ui.grid.class:Grid
   * @description returns the first GridRow who has an key that is equal to comparator
   * so for Example if isInEntity == false then it does this check: row[key] === comparator
   * if isInEntity == true then it does this check: row.entity[key] === comparator
   * @param {boolean} isInEntity if true then key is in entity else it's directly in row
   * @param {(string|number)} key the key to look for
   * @param {any} comparator the value that key should have
   * @param {array} lookInRows [optional] the rows to look in - if not provided then
   * looks in grid.rows
   */
  Grid.prototype.findRowByKey = function findRowByKey(isInEntity, key, comparator, lookInRows) {
    var result = null;
    if ( key != void 0 ) {
      lookInRows = lookInRows == void 0 ? this.rows : lookInRows;
      var func = isInEntity ? function (row) {
        if ( row.entity != void 0 && row.entity.hasOwnProperty(key) && row.entity[key] === comparator ) {
          result = row;
          return false;
        }
        return true;
      } : function (row) {
        if ( row.hasOwnProperty(key) && row[key] === comparator ) {
          result = row;
          return false;
        }
        return true;
      }

      lookInRows.every(func);
    }
    return result
  };

  /**
   * @ngdoc function
   * @name modifyRows
   * @methodOf ui.grid.class:Grid
   * @description creates or removes GridRow objects from the newRawData array.  Calls each registered
   * rowBuilder to further process the row
   * @param {array} newRawData Modified set of data
   *
   * This method aims to achieve three things:
   * 1. the resulting rows array is in the same order as the newRawData, we'll call
   * rowsProcessors immediately after to sort the data anyway
   * 2. if we have row hashing available, we try to use the rowHash to find the row
   * 3. no memory leaks - rows that are no longer in newRawData need to be garbage collected
   *
   * The basic logic flow makes use of the newRawData, oldRows and oldHash, and creates
   * the newRows and newHash
   *
   * ```
   * newRawData.forEach newEntity
   *   if (hashing enabled)
   *     check oldHash for newEntity
   *   else
   *     look for old row directly in oldRows
   *   if !oldRowFound     // must be a new row
   *     create newRow
   *   append to the newRows and add to newHash
   *   run the processors
   * ```
   *
   * Rows are identified using the hashKey if configured.  If not configured, then rows
   * are identified using the gridOptions.rowEquality function
   *
   * This method is useful when trying to select rows immediately after loading data without
   * using a $timeout/$interval, e.g.:
   *
   *   $scope.gridOptions.data =  someData;
   *   $scope.gridApi.grid.modifyRows($scope.gridOptions.data);
   *   $scope.gridApi.selection.selectRow($scope.gridOptions.data[0]);
   *
   * OR to persist row selection after data update (e.g. rows selected, new data loaded, want
   * originally selected rows to be re-selected))
   */
  Grid.prototype.modifyRows = function modifyRows(newRawData) {
    var self = this;
    var oldRows = self.rows.slice(0);
    var oldRowHash = self.rowHashMap || self.createRowHashMap();
    var allRowsSelected = true;
    self.rowHashMap = self.createRowHashMap();
    self.rows.length = 0;

    newRawData.forEach( function( newEntity, i ) {
      var newRow, oldRow;

      if ( self.options.enableRowHashing ) {
        // if hashing is enabled, then this row will be in the hash if we already know about it
        oldRow = oldRowHash.get( newEntity );
      } else {
        // otherwise, manually search the oldRows to see if we can find this row
        oldRow = self.getRow(newEntity, oldRows);
      }

      // update newRow to have an entity
      if ( oldRow ) {
        newRow = oldRow;
        newRow.entity = newEntity;
        if (newRow.index !== i) {
          newRow.index = i;
        }
      }

      // if we didn't find the row, it must be new, so create it
      if ( !newRow ) {
        newRow = self.processRowBuilders(new GridRow(newEntity, i, self));
      }

      self.rows.push( newRow );
      self.rowHashMap.put( newEntity, newRow );
      if (!newRow.isSelected) {
        allRowsSelected = false;
      }
    });

    if (self.selection && self.rows.length) {
      self.selection.selectAll = allRowsSelected;
    }

    self.assignTypes();

    var p1 = $q.when(self.processRowsProcessors(self.rows))
      .then(function (renderableRows) {
        return self.setVisibleRows(renderableRows);
      }).catch(function(err) { $log.error(err); });

    var p2 = $q.when(self.processColumnsProcessors(self.columns))
      .then(function (renderableColumns) {
        return self.setVisibleColumns(renderableColumns);
      }).catch(function(err) { $log.error(err); });

    return $q.all([p1, p2]);
  };


  /**
   * Private Undocumented Method
   * @name addRows
   * @methodOf ui.grid.class:Grid
   * @description adds the newRawData array of rows to the grid and calls all registered
   * rowBuilders. this keyword will reference the grid
   */
  Grid.prototype.addRows = function addRows(newRawData) {
    var self = this,
      existingRowCount = self.rows.length;

    for (var i = 0; i < newRawData.length; i++) {
      var newRow = self.processRowBuilders(new GridRow(newRawData[i], i + existingRowCount, self));

      if (self.options.enableRowHashing) {
        var found = self.rowHashMap.get(newRow.entity);
        if (found) {
          found.row = newRow;
        }
      }

      self.rows.push(newRow);
    }
  };

  /**
   * @ngdoc function
   * @name processRowBuilders
   * @methodOf ui.grid.class:Grid
   * @description processes all RowBuilders for the gridRow
   * @param {GridRow} gridRow reference to gridRow
   * @returns {GridRow} the gridRow with all additional behavior added
   */
  Grid.prototype.processRowBuilders = function processRowBuilders(gridRow) {
    var self = this;

    self.rowBuilders.forEach(function (builder) {
      builder.call(self, gridRow, self.options);
    });

    return gridRow;
  };

  /**
   * @ngdoc function
   * @name registerStyleComputation
   * @methodOf ui.grid.class:Grid
   * @description registered a styleComputation function
   *
   * If the function returns a value it will be appended into the grid's `<style>` block
   * @param {function($scope)} styleComputationInfo function
   */
  Grid.prototype.registerStyleComputation = function registerStyleComputation(styleComputationInfo) {
    this.styleComputations.push(styleComputationInfo);
  };

  /**
   * @ngdoc function
   * @name registerRowsProcessor
   * @methodOf ui.grid.class:Grid
   * @description
   *
   * Register a "rows processor" function. When the rows are updated,
   * the grid calls each registered "rows processor", which has a chance
   * to alter the set of rows (sorting, etc) as long as the count is not
   * modified.
   *
   * @param {function(renderedRowsToProcess, columns )} processor rows processor function, which
   * is run in the context of the grid (i.e. this for the function will be the grid), and must
   * return the updated rows list, which is passed to the next processor in the chain
   * @param {number} priority the priority of this processor.  In general we try to do them in 100s to leave room
   * for other people to inject rows processors at intermediate priorities.  Lower priority rowsProcessors run earlier.
   *
   * At present all rows visible is running at 50, filter is running at 100, sort is at 200, grouping at 400, selectable rows at 500, pagination at 900 (pagination will generally want to be last)
   *
   */
  Grid.prototype.registerRowsProcessor = function registerRowsProcessor(processor, priority) {
    if (!angular.isFunction(processor)) {
      throw 'Attempt to register non-function rows processor: ' + processor;
    }

    this.rowsProcessors.push({processor: processor, priority: priority});
    this.rowsProcessors.sort(function sortByPriority( a, b ) {
      return a.priority - b.priority;
    });
  };

  /**
   * @ngdoc function
   * @name removeRowsProcessor
   * @methodOf ui.grid.class:Grid
   * @param {function(renderableRows)} processor processor function
   * @description Remove a registered rows processor
   */
  Grid.prototype.removeRowsProcessor = function removeRowsProcessor(processor) {
    var idx = -1;
    this.rowsProcessors.forEach(function(rowsProcessor, index) {
      if ( rowsProcessor.processor === processor ) {
        idx = index;
      }
    });

    if ( idx !== -1 ) {
      this.rowsProcessors.splice(idx, 1);
    }
  };

  /**
   * Private Undocumented Method
   * @name processRowsProcessors
   * @methodOf ui.grid.class:Grid
   * @param {Array[GridRow]} renderableRows The array of "renderable" rows
   * @description Run all the registered rows processors on the array of renderable rows
   */
  Grid.prototype.processRowsProcessors = function processRowsProcessors(renderableRows) {
    var self = this;

    // Create a shallow copy of the rows so that we can safely sort them without altering the original grid.rows sort order
    var myRenderableRows = renderableRows.slice(0);

    // Return myRenderableRows with no processing if we have no rows processors
    if (self.rowsProcessors.length === 0) {
      return $q.when(myRenderableRows);
    }

    // Counter for iterating through rows processors
    var i = 0;

    // Promise for when we're done with all the processors
    var finished = $q.defer();

    // This function will call the processor in self.rowsProcessors at index 'i', and then
    //   when done will call the next processor in the list, using the output from the processor
    //   at i as the argument for 'renderedRowsToProcess' on the next iteration.
    //
    //   If we're at the end of the list of processors, we resolve our 'finished' callback with
    //   the result.
    function startProcessor(i, renderedRowsToProcess) {
      // Get the processor at 'i'
      var processor = self.rowsProcessors[i].processor;

      // Call the processor, passing in the rows to process and the current columns
      //   (note: it's wrapped in $q.when() in case the processor does not return a promise)
      return $q.when( processor.call(self, renderedRowsToProcess, self.columns) )
        .then(function handleProcessedRows(processedRows) {
          // Check for errors
          if (!processedRows) {
            throw "Processor at index " + i + " did not return a set of renderable rows";
          }

          if (!angular.isArray(processedRows)) {
            throw "Processor at index " + i + " did not return an array";
          }

          // Processor is done, increment the counter
          i++;

          // If we're not done with the processors, call the next one
          if (i <= self.rowsProcessors.length - 1) {
            return startProcessor(i, processedRows);
          }
          // We're done! Resolve the 'finished' promise
          else {
            finished.resolve(processedRows);
          }
        }).catch(function(error) {
          throw error;
        });
    }

    // Start on the first processor
    startProcessor(0, myRenderableRows);

    return finished.promise;
  };

  Grid.prototype.setVisibleRows = function setVisibleRows(rows) {
    var self = this;

    // Reset all the render container row caches
    for (var i in self.renderContainers) {
      var container = self.renderContainers[i];

      container.canvasHeightShouldUpdate = true;

      if ( typeof(container.visibleRowCache) === 'undefined' ) {
        container.visibleRowCache = [];
      } else {
        container.visibleRowCache.length = 0;
      }
    }

    // rows.forEach(function (row) {
    for (var ri = 0; ri < rows.length; ri++) {
      var row = rows[ri];

      var targetContainer = (typeof(row.renderContainer) !== 'undefined' && row.renderContainer) ? row.renderContainer : 'body';

      // If the row is visible
      if (row.visible) {
        self.renderContainers[targetContainer].visibleRowCache.push(row);
      }
    }
    self.api.core.raise.rowsVisibleChanged(this.api);
    self.api.core.raise.rowsRendered(this.api);
  };

  /**
   * @ngdoc function
   * @name registerColumnsProcessor
   * @methodOf ui.grid.class:Grid
   * @param {function(renderedColumnsToProcess, rows)} processor column processor function, which
   * is run in the context of the grid (i.e. this for the function will be the grid), and
   * which must return an updated renderedColumnsToProcess which can be passed to the next processor
   * in the chain
   * @param {number} priority the priority of this processor.  In general we try to do them in 100s to leave room
   * for other people to inject columns processors at intermediate priorities.  Lower priority columnsProcessors run earlier.
   *
   * At present all rows visible is running at 50, filter is running at 100, sort is at 200, grouping at 400, selectable rows at 500, pagination at 900 (pagination will generally want to be last)
   * @description

     Register a "columns processor" function. When the columns are updated,
     the grid calls each registered "columns processor", which has a chance
     to alter the set of columns, as long as the count is not modified.
   */
  Grid.prototype.registerColumnsProcessor = function registerColumnsProcessor(processor, priority) {
    if (!angular.isFunction(processor)) {
      throw 'Attempt to register non-function rows processor: ' + processor;
    }

    this.columnsProcessors.push({processor: processor, priority: priority});
    this.columnsProcessors.sort(function sortByPriority( a, b ) {
      return a.priority - b.priority;
    });
  };

  Grid.prototype.removeColumnsProcessor = function removeColumnsProcessor(processor) {
    var idx = this.columnsProcessors.indexOf(processor);

    if (typeof(idx) !== 'undefined' && idx !== undefined) {
      this.columnsProcessors.splice(idx, 1);
    }
  };

  Grid.prototype.processColumnsProcessors = function processColumnsProcessors(renderableColumns) {
    var self = this;

    // Create a shallow copy of the rows so that we can safely sort them without altering the original grid.rows sort order
    var myRenderableColumns = renderableColumns.slice(0);

    // Return myRenderableRows with no processing if we have no rows processors
    if (self.columnsProcessors.length === 0) {
      return $q.when(myRenderableColumns);
    }

    // Promise for when we're done with all the processors
    var finished = $q.defer();

    // This function will call the processor in self.rowsProcessors at index 'i', and then
    //   when done will call the next processor in the list, using the output from the processor
    //   at i as the argument for 'renderedRowsToProcess' on the next iteration.
    //
    //   If we're at the end of the list of processors, we resolve our 'finished' callback with
    //   the result.
    function startProcessor(i, renderedColumnsToProcess) {
      // Get the processor at 'i'
      var processor = self.columnsProcessors[i].processor;

      // Call the processor, passing in the rows to process and the current columns
      //   (note: it's wrapped in $q.when() in case the processor does not return a promise)
      return $q.when( processor.call(self, renderedColumnsToProcess, self.rows) )
        .then(function handleProcessedRows(processedColumns) {
          // Check for errors
          if (!processedColumns) {
            throw "Processor at index " + i + " did not return a set of renderable rows";
          }

          if (!angular.isArray(processedColumns)) {
            throw "Processor at index " + i + " did not return an array";
          }

          // Processor is done, increment the counter
          i++;

          // If we're not done with the processors, call the next one
          if (i <= self.columnsProcessors.length - 1) {
            return startProcessor(i, myRenderableColumns);
          }
          // We're done! Resolve the 'finished' promise
          else {
            finished.resolve(myRenderableColumns);
          }
        }).catch(function(err) { $log.error(err); });
    }

    // Start on the first processor
    startProcessor(0, myRenderableColumns);

    return finished.promise;
  };

  Grid.prototype.setVisibleColumns = function setVisibleColumns(columns) {
    // gridUtil.logDebug('setVisibleColumns');

    var self = this;

    // Reset all the render container row caches
    for (var i in self.renderContainers) {
      var container = self.renderContainers[i];

      container.visibleColumnCache.length = 0;
    }

    for (var ci = 0; ci < columns.length; ci++) {
      var column = columns[ci];

      // If the column is visible
      if (column.visible) {
        // If the column has a container specified
        if (typeof(column.renderContainer) !== 'undefined' && column.renderContainer) {
          self.renderContainers[column.renderContainer].visibleColumnCache.push(column);
        }
        // If not, put it into the body container
        else {
          self.renderContainers.body.visibleColumnCache.push(column);
        }
      }
    }
  };

  /**
   * @ngdoc function
   * @name handleWindowResize
   * @methodOf ui.grid.class:Grid
   * @description Triggered when the browser window resizes; automatically resizes the grid
   * @returns {Promise} A resolved promise once the window resize has completed.
   */
  Grid.prototype.handleWindowResize = function handleWindowResize($event) {
    var self = this;

    self.gridWidth = gridUtil.elementWidth(self.element);
    self.gridHeight = gridUtil.elementHeight(self.element);

    return self.queueRefresh();
  };

  /**
   * @ngdoc function
   * @name queueRefresh
   * @methodOf ui.grid.class:Grid
   * @description queues a grid refreshCanvas, a way of debouncing all the refreshes we might otherwise issue
   */
  Grid.prototype.queueRefresh = function queueRefresh() {
    var self = this;

    if (self.refreshCanceller) {
      $timeout.cancel(self.refreshCanceller);
    }

    self.refreshCanceller = $timeout(function () {
      self.refreshCanvas(true);
    });

    self.refreshCanceller.then(function () {
      self.refreshCanceller = null;
    }).catch(function(err) { $log.error(err); });

    return self.refreshCanceller;
  };


  /**
   * @ngdoc function
   * @name queueGridRefresh
   * @methodOf ui.grid.class:Grid
   * @description queues a grid refresh, a way of debouncing all the refreshes we might otherwise issue
   */
  Grid.prototype.queueGridRefresh = function queueGridRefresh() {
    var self = this;

    if (self.gridRefreshCanceller) {
      $timeout.cancel(self.gridRefreshCanceller);
    }

    self.gridRefreshCanceller = $timeout(function () {
      self.refresh(true);
    });

    self.gridRefreshCanceller.then(function () {
      self.gridRefreshCanceller = null;
    }).catch(function(err) { $log.error(err); });

    return self.gridRefreshCanceller;
  };


  /**
   * @ngdoc function
   * @name updateCanvasHeight
   * @methodOf ui.grid.class:Grid
   * @description flags all render containers to update their canvas height
   */
  Grid.prototype.updateCanvasHeight = function updateCanvasHeight() {
    var self = this;

    for (var containerId in self.renderContainers) {
      if (self.renderContainers.hasOwnProperty(containerId)) {
        var container = self.renderContainers[containerId];
        container.canvasHeightShouldUpdate = true;
      }
    }
  };

  /**
   * @ngdoc function
   * @name buildStyles
   * @methodOf ui.grid.class:Grid
   * @description calls each styleComputation function
   */
  Grid.prototype.buildStyles = function buildStyles() {
    var self = this;

    // gridUtil.logDebug('buildStyles');

    self.customStyles = '';

    self.styleComputations
      .sort(function(a, b) {
        if (a.priority === null) { return 1; }
        if (b.priority === null) { return -1; }
        if (a.priority === null && b.priority === null) { return 0; }
        return a.priority - b.priority;
      })
      .forEach(function (compInfo) {
        // this used to provide $scope as a second parameter, but I couldn't find any
        // style builders that used it, so removed it as part of moving to grid from controller
        var ret = compInfo.func.call(self);

        if (angular.isString(ret)) {
          self.customStyles += '\n' + ret;
        }
      });
  };


  Grid.prototype.minColumnsToRender = function minColumnsToRender() {
    var self = this;
    var viewport = this.getViewportWidth();

    var min = 0;
    var totalWidth = 0;
    self.columns.forEach(function(col, i) {
      if (totalWidth < viewport) {
        totalWidth += col.drawnWidth;
        min++;
      }
      else {
        var currWidth = 0;
        for (var j = i; j >= i - min; j--) {
          currWidth += self.columns[j].drawnWidth;
        }
        if (currWidth < viewport) {
          min++;
        }
      }
    });

    return min;
  };

  Grid.prototype.getBodyHeight = function getBodyHeight() {
    return this.getViewportHeight();
  };

  // NOTE: viewport drawable height is the height of the grid minus the header row height (including any border)
  // TODO(c0bra): account for footer height
  Grid.prototype.getViewportHeight = function getViewportHeight() {
    var self = this;

    var viewPortHeight = this.gridHeight - this.headerHeight - this.footerHeight;

    // Account for native horizontal scrollbar, if present
    // if (typeof(this.horizontalScrollbarHeight) !== 'undefined' && this.horizontalScrollbarHeight !== undefined && this.horizontalScrollbarHeight > 0) {
    //   viewPortHeight = viewPortHeight - this.horizontalScrollbarHeight;
    // }

    var adjustment = self.getViewportAdjustment();

    viewPortHeight = viewPortHeight + adjustment.height;

    // gridUtil.logDebug('viewPortHeight', viewPortHeight);

    return viewPortHeight > 0 ? viewPortHeight : 0;
  };

  Grid.prototype.getViewportWidth = function getViewportWidth() {
    var self = this;

    var viewPortWidth = this.gridWidth;

    // if (typeof(this.verticalScrollbarWidth) !== 'undefined' && this.verticalScrollbarWidth !== undefined && this.verticalScrollbarWidth > 0) {
    //   viewPortWidth = viewPortWidth - this.verticalScrollbarWidth;
    // }

    var adjustment = self.getViewportAdjustment();

    viewPortWidth = viewPortWidth + adjustment.width;

    // gridUtil.logDebug('getviewPortWidth', viewPortWidth);

    return viewPortWidth;
  };

  Grid.prototype.getHeaderViewportWidth = function getHeaderViewportWidth() {
    return this.getViewportWidth();
  };

  Grid.prototype.addVerticalScrollSync = function (containerId, callBackFn) {
    this.verticalScrollSyncCallBackFns[containerId] = callBackFn;
  };

  Grid.prototype.addHorizontalScrollSync = function (containerId, callBackFn) {
    this.horizontalScrollSyncCallBackFns[containerId] = callBackFn;
  };

/**
 * Scroll needed containers by calling their ScrollSyncs
 * @param sourceContainerId the containerId that has already set it's top/left.
 *         can be empty string which means all containers need to set top/left
 * @param scrollEvent
 */
  Grid.prototype.scrollContainers = function (sourceContainerId, scrollEvent) {
    if (scrollEvent.y) {
      // default for no container Id (ex. mousewheel means that all containers must set scrollTop/Left)
      var verts = ['body','left', 'right'];

      this.flagScrollingVertically(scrollEvent);

      if (sourceContainerId === 'body') {
        verts = ['left', 'right'];
      }
      else if (sourceContainerId === 'left') {
        verts = ['body', 'right'];
      }
      else if (sourceContainerId === 'right') {
        verts = ['body', 'left'];
      }

      for (var i = 0; i < verts.length; i++) {
        var id = verts[i];
        if (this.verticalScrollSyncCallBackFns[id]) {
          this.verticalScrollSyncCallBackFns[id](scrollEvent);
        }
      }

    }

    if (scrollEvent.x) {
      // default for no container Id (ex. mousewheel means that all containers must set scrollTop/Left)
      var horizs = ['body','bodyheader', 'bodyfooter'];

      this.flagScrollingHorizontally(scrollEvent);
      if (sourceContainerId === 'body') {
        horizs = ['bodyheader', 'bodyfooter'];
      }

      for (var j = 0; j < horizs.length; j++) {
        var idh = horizs[j];
        if (this.horizontalScrollSyncCallBackFns[idh]) {
          this.horizontalScrollSyncCallBackFns[idh](scrollEvent);
        }
      }
    }
  };

  Grid.prototype.registerViewportAdjuster = function registerViewportAdjuster(func) {
    this.viewportAdjusters.push(func);
  };

  Grid.prototype.removeViewportAdjuster = function registerViewportAdjuster(func) {
    var idx = this.viewportAdjusters.indexOf(func);

    if (typeof(idx) !== 'undefined' && idx !== undefined) {
      this.viewportAdjusters.splice(idx, 1);
    }
  };

  Grid.prototype.getViewportAdjustment = function getViewportAdjustment() {
    var self = this;

    var adjustment = { height: 0, width: 0 };

    self.viewportAdjusters.forEach(function (func) {
      adjustment = func.call(this, adjustment);
    });

    return adjustment;
  };

  Grid.prototype.getVisibleRowCount = function getVisibleRowCount() {
    // return this.visibleRowCache.length;
    return this.renderContainers.body.visibleRowCache.length;
  };

   Grid.prototype.getVisibleRows = function getVisibleRows() {
    return this.renderContainers.body.visibleRowCache;
   };

  Grid.prototype.getVisibleColumnCount = function getVisibleColumnCount() {
    // return this.visibleRowCache.length;
    return this.renderContainers.body.visibleColumnCache.length;
  };


  Grid.prototype.searchRows = function searchRows(renderableRows) {
    return rowSearcher.search(this, renderableRows, this.columns);
  };

  Grid.prototype.sortByColumn = function sortByColumn(renderableRows) {
    return rowSorter.sort(this, renderableRows, this.columns);
  };

  /**
   * @ngdoc function
   * @name getCellValue
   * @methodOf ui.grid.class:Grid
   * @description Gets the value of a cell for a particular row and column
   * @param {GridRow} row Row to access
   * @param {GridColumn} col Column to access
   */
  Grid.prototype.getCellValue = function getCellValue(row, col) {
    if ( typeof(row.entity[ '$$' + col.uid ]) !== 'undefined' ) {
      return row.entity[ '$$' + col.uid].rendered;
    }
    else if (this.options.flatEntityAccess && typeof(col.field) !== 'undefined' ) {
      return row.entity[col.field];
    }
    else {
      if (!col.cellValueGetterCache) {
        col.cellValueGetterCache = $parse(row.getEntityQualifiedColField(col));
      }

      return col.cellValueGetterCache(row);
    }
  };

  /**
   * @ngdoc function
   * @name getCellDisplayValue
   * @methodOf ui.grid.class:Grid
   * @description Gets the displayed value of a cell after applying any the `cellFilter`
   * @param {GridRow} row Row to access
   * @param {GridColumn} col Column to access
   */
  Grid.prototype.getCellDisplayValue = function getCellDisplayValue(row, col) {
    if ( !col.cellDisplayGetterCache ) {
      var custom_filter = col.cellFilter ? " | " + col.cellFilter : "";

      if (typeof(row.entity['$$' + col.uid]) !== 'undefined') {
        col.cellDisplayGetterCache = $parse(row.entity['$$' + col.uid].rendered + custom_filter);
      }
      else if (this.options.flatEntityAccess && typeof(col.field) !== 'undefined') {
        var colField = col.field.replace(/(')|(\\)/g, "\\$&");

        col.cellDisplayGetterCache = $parse('entity[\'' + colField + '\']' + custom_filter);
      }
      else {
        col.cellDisplayGetterCache = $parse(row.getEntityQualifiedColField(col) + custom_filter);
      }
    }

    var rowWithCol = angular.extend({}, row, {col: col});

    return col.cellDisplayGetterCache(rowWithCol);
  };


  Grid.prototype.getNextColumnSortPriority = function getNextColumnSortPriority() {
    var self = this,
        p = 0;

    self.columns.forEach(function (col) {
      if (col.sort && col.sort.priority !== undefined && col.sort.priority >= p) {
        p = col.sort.priority + 1;
      }
    });

    return p;
  };

  /**
   * @ngdoc function
   * @name resetColumnSorting
   * @methodOf ui.grid.class:Grid
   * @description Return the columns that the grid is currently being sorted by
   * @param {GridColumn} [excludedColumn] Optional GridColumn to exclude from having its sorting reset
   */
  Grid.prototype.resetColumnSorting = function resetColumnSorting(excludeCol) {
    var self = this;

    self.columns.forEach(function (col) {
      if (col !== excludeCol && !col.suppressRemoveSort) {
        col.sort = {};
      }
    });
  };

  /**
   * @ngdoc function
   * @name getColumnSorting
   * @methodOf ui.grid.class:Grid
   * @description Return the columns that the grid is currently being sorted by
   * @returns {Array[GridColumn]} An array of GridColumn objects
   */
  Grid.prototype.getColumnSorting = function getColumnSorting() {
    var self = this;

    var sortedCols = [], myCols;

    // Iterate through all the columns, sorted by priority
    // Make local copy of column list, because sorting is in-place and we do not want to
    // change the original sequence of columns
    myCols = self.columns.slice(0);
    myCols.sort(rowSorter.prioritySort).forEach(function (col) {
      if (col.sort && typeof(col.sort.direction) !== 'undefined' && col.sort.direction && (col.sort.direction === uiGridConstants.ASC || col.sort.direction === uiGridConstants.DESC)) {
        sortedCols.push(col);
      }
    });

    return sortedCols;
  };

  /**
   * @ngdoc function
   * @name sortColumn
   * @methodOf ui.grid.class:Grid
   * @description Set the sorting on a given column, optionally resetting any existing sorting on the Grid.
   * Emits the sortChanged event whenever the sort criteria are changed.
   * @param {GridColumn} column Column to set the sorting on
   * @param {uiGridConstants.ASC|uiGridConstants.DESC} [direction] Direction to sort by, either descending or ascending.
   *   If not provided, the column will iterate through the sort directions
   *   specified in the {@link ui.grid.class:GridOptions.columnDef#sortDirectionCycle sortDirectionCycle} attribute.
   * @param {boolean} [add] Add this column to the sorting. If not provided or set to `false`, the Grid will reset any existing sorting and sort
   *   by this column only
   * @returns {Promise} A resolved promise that supplies the column.
   */

  Grid.prototype.sortColumn = function sortColumn(column, directionOrAdd, add) {
    var self = this,
        direction = null;

    if (typeof(column) === 'undefined' || !column) {
      throw new Error('No column parameter provided');
    }

    // Second argument can either be a direction or whether to add this column to the existing sort.
    //   If it's a boolean, it's an add, otherwise, it's a direction
    if (typeof(directionOrAdd) === 'boolean') {
      add = directionOrAdd;
    }
    else {
      direction = directionOrAdd;
    }

    if (!add || (self.options && self.options.suppressMultiSort)) {
      self.resetColumnSorting(column);
      column.sort.priority = undefined;
      // Get the actual priority since there may be columns which have suppressRemoveSort set
      column.sort.priority = self.getNextColumnSortPriority();
    }
    else if (column.sort.priority === undefined) {
      column.sort.priority = self.getNextColumnSortPriority();
    }

    if (!direction) {
      // Find the current position in the cycle (or -1).
      var i = column.sortDirectionCycle.indexOf(column.sort && column.sort.direction ? column.sort.direction : null);
      // Proceed to the next position in the cycle (or start at the beginning).
      i = (i+1) % column.sortDirectionCycle.length;
      // If suppressRemoveSort is set, and the next position in the cycle would
      // remove the sort, skip it.
      if (column.colDef && column.suppressRemoveSort && !column.sortDirectionCycle[i]) {
        i = (i+1) % column.sortDirectionCycle.length;
      }

      if (column.sortDirectionCycle[i]) {
        column.sort.direction = column.sortDirectionCycle[i];
      } else {
        removeSortOfColumn(column, self);
      }
    }
    else {
      column.sort.direction = direction;
    }

    self.api.core.raise.sortChanged( self, self.getColumnSorting() );

    return $q.when(column);
  };

  var removeSortOfColumn = function removeSortOfColumn(column, grid) {
    // Decrease priority for every col where priority is higher than the removed sort's priority.
    grid.columns.forEach(function (col) {
      if (col.sort && col.sort.priority !== undefined && col.sort.priority > column.sort.priority) {
        col.sort.priority -= 1;
      }
    });

    // Remove sort
    column.sort = {};
  };

  /**
   * communicate to outside world that we are done with initial rendering
   */
  Grid.prototype.renderingComplete = function() {
    if (angular.isFunction(this.options.onRegisterApi)) {
      this.options.onRegisterApi(this.api);
    }
    this.api.core.raise.renderingComplete( this.api );
  };

  Grid.prototype.createRowHashMap = function createRowHashMap() {
    var self = this;

    var hashMap = new RowHashMap();
    hashMap.grid = self;

    return hashMap;
  };


  /**
   * @ngdoc function
   * @name refresh
   * @methodOf ui.grid.class:Grid
   * @description Refresh the rendered grid on screen.
   * @param {boolean} [rowsAltered] Optional flag for refreshing when the number of rows has changed.
   */
  Grid.prototype.refresh = function refresh(rowsAltered) {
    var self = this;

    var p1 = self.processRowsProcessors(self.rows).then(function (renderableRows) {
      self.setVisibleRows(renderableRows);
    }).catch(function(err) { $log.error(err); });

    var p2 = self.processColumnsProcessors(self.columns).then(function (renderableColumns) {
      self.setVisibleColumns(renderableColumns);
    }).catch(function(err) { $log.error(err); });

    return $q.all([p1, p2]).then(function () {
      self.refreshCanvas(true);
      self.redrawInPlace(rowsAltered);
    }).catch(function(err) { $log.error(err); });
  };

  /**
   * @ngdoc function
   * @name refreshRows
   * @methodOf ui.grid.class:Grid
   * @description Refresh the rendered rows on screen?  Note: not functional at present
   * @returns {promise} promise that is resolved when render completes?
   *
   */
  Grid.prototype.refreshRows = function refreshRows() {
    var self = this;

    return self.processRowsProcessors(self.rows)
      .then(function (renderableRows) {
        self.setVisibleRows(renderableRows);

        self.redrawInPlace();

        self.refreshCanvas( true );
      }).catch(function(err) { $log.error(err); });
  };

  /**
   * @ngdoc function
   * @name refreshCanvas
   * @methodOf ui.grid.class:Grid
   * @description Builds all styles and recalculates much of the grid sizing
   * @param {object} buildStyles optional parameter.  Use TBD
   * @returns {promise} promise that is resolved when the canvas
   * has been refreshed
   *
   */
  Grid.prototype.refreshCanvas = function(buildStyles) {
    var self = this;

    // gridUtil.logDebug('refreshCanvas');

    var p = $q.defer();

    // Get all the header heights
    var containerHeadersToRecalc = [];
    for (var containerId in self.renderContainers) {
      if (self.renderContainers.hasOwnProperty(containerId)) {
        var container = self.renderContainers[containerId];

        // Skip containers that have no canvasWidth set yet
        if (container.canvasWidth === null || isNaN(container.canvasWidth)) {
          continue;
        }

        if (container.header || container.headerCanvas) {
          container.explicitHeaderHeight = container.explicitHeaderHeight || null;
          container.explicitHeaderCanvasHeight = container.explicitHeaderCanvasHeight || null;

          containerHeadersToRecalc.push(container);
        }
      }
    }

    // Build the styles without the explicit header heights
    if (buildStyles) {
      self.buildStyles();
    }

    /*
     *
     * Here we loop through the headers, measuring each element as well as any header "canvas" it has within it.
     *
     * If any header is less than the largest header height, it will be resized to that so that we don't have headers
     * with different heights, which looks like a rendering problem
     *
     * We'll do the same thing with the header canvases, and give the header CELLS an explicit height if their canvas
     * is smaller than the largest canvas height. That was header cells without extra controls like filtering don't
     * appear shorter than other cells.
     *
     */
    if (containerHeadersToRecalc.length > 0) {
      // Putting in a timeout as it's not calculating after the grid element is rendered and filled out
      $timeout(function() {
        // var oldHeaderHeight = self.grid.headerHeight;
        // self.grid.headerHeight = gridUtil.outerElementHeight(self.header);

        var rebuildStyles = false;

        // Get all the header heights
        var maxHeaderHeight = 0;
        var maxHeaderCanvasHeight = 0;
        var i, container;
        var getHeight = function(oldVal, newVal) {
          if ( oldVal !== newVal) {
            rebuildStyles = true;
          }
          return newVal;
        };
        for (i = 0; i < containerHeadersToRecalc.length; i++) {
          container = containerHeadersToRecalc[i];

          // Skip containers that have no canvasWidth set yet
          if (container.canvasWidth === null || isNaN(container.canvasWidth)) {
            continue;
          }

          if (container.header) {
            var headerHeight = container.headerHeight = getHeight(container.headerHeight, gridUtil.outerElementHeight(container.header));

            // Get the "inner" header height, that is the height minus the top and bottom borders, if present. We'll use it to make sure all the headers have a consistent height
            var topBorder = gridUtil.getBorderSize(container.header, 'top');
            var bottomBorder = gridUtil.getBorderSize(container.header, 'bottom');
            var innerHeaderHeight = parseInt(headerHeight - topBorder - bottomBorder, 10);

            innerHeaderHeight  = innerHeaderHeight < 0 ? 0 : innerHeaderHeight;

            container.innerHeaderHeight = innerHeaderHeight;

            // If the header doesn't have an explicit height set, save the largest header height for use later
            //   Explicit header heights are based off of the max we are calculating here. We never want to base the max on something we're setting explicitly
            if (!container.explicitHeaderHeight && innerHeaderHeight > maxHeaderHeight) {
              maxHeaderHeight = innerHeaderHeight;
            }
          }

          if (container.headerCanvas) {
            var headerCanvasHeight = container.headerCanvasHeight = getHeight(container.headerCanvasHeight, parseInt(gridUtil.outerElementHeight(container.headerCanvas), 10));


            // If the header doesn't have an explicit canvas height, save the largest header canvas height for use later
            //   Explicit header heights are based off of the max we are calculating here. We never want to base the max on something we're setting explicitly
            if (!container.explicitHeaderCanvasHeight && headerCanvasHeight > maxHeaderCanvasHeight) {
              maxHeaderCanvasHeight = headerCanvasHeight;
            }
          }
        }

        // Go through all the headers
        for (i = 0; i < containerHeadersToRecalc.length; i++) {
          container = containerHeadersToRecalc[i];

          /* If:
              1. We have a max header height
              2. This container has a header height defined
              3. And either this container has an explicit header height set, OR its header height is less than the max

              then:

              Give this container's header an explicit height so it will line up with the tallest header
          */
          if (
            maxHeaderHeight > 0 && typeof(container.headerHeight) !== 'undefined' && container.headerHeight !== null &&
            (container.explicitHeaderHeight || container.headerHeight < maxHeaderHeight)
          ) {
            container.explicitHeaderHeight = getHeight(container.explicitHeaderHeight, maxHeaderHeight);
          }

          // Do the same as above except for the header canvas
          if (
            maxHeaderCanvasHeight > 0 && typeof(container.headerCanvasHeight) !== 'undefined' && container.headerCanvasHeight !== null &&
            (container.explicitHeaderCanvasHeight || container.headerCanvasHeight < maxHeaderCanvasHeight)
          ) {
            container.explicitHeaderCanvasHeight = getHeight(container.explicitHeaderCanvasHeight, maxHeaderCanvasHeight);
          }
        }

        // Rebuild styles if the header height has changed
        //   The header height is used in body/viewport calculations and those are then used in other styles so we need it to be available
        if (buildStyles && rebuildStyles) {
          self.buildStyles();
        }

        p.resolve();
      });
    }
    else {
      // Timeout still needs to be here to trigger digest after styles have been rebuilt
      $timeout(function() {
        p.resolve();
      });
    }

    return p.promise;
  };

  function getPrevScrollValue(rowsAdded, prevScrollVal) {
    return rowsAdded || prevScrollVal > 0 ? prevScrollVal : null;
  }

  /**
   * @ngdoc function
   * @name redrawInPlace
   * @methodOf ui.grid.class:Grid
   * @description Redraw the rows and columns based on our current scroll position
   * @param {boolean} [rowsAdded] Optional to indicate rows are added and the scroll percentage must be recalculated
   *
   */
  Grid.prototype.redrawInPlace = function redrawInPlace(rowsAdded) {
    // gridUtil.logDebug('redrawInPlace');

    var self = this;

    for (var i in self.renderContainers) {
      var container = self.renderContainers[i],
        prevScrollTop = getPrevScrollValue(rowsAdded, container.prevScrollTop),
        prevScrollLeft = getPrevScrollValue(rowsAdded, container.prevScrollLeft),
        prevScrolltopPercentage = rowsAdded || prevScrollTop > 0 ? null : container.prevScrolltopPercentage;

      // gridUtil.logDebug('redrawing container', i);

      container.adjustRows(prevScrollTop, prevScrolltopPercentage);
      container.adjustColumns(prevScrollLeft);
    }
  };

    /**
     * @ngdoc function
     * @name hasLeftContainerColumns
     * @methodOf ui.grid.class:Grid
     * @description returns true if leftContainer has columns
     */
    Grid.prototype.hasLeftContainerColumns = function () {
      return this.hasLeftContainer() && this.renderContainers.left.renderedColumns.length > 0;
    };

    /**
     * @ngdoc function
     * @name hasRightContainerColumns
     * @methodOf ui.grid.class:Grid
     * @description returns true if rightContainer has columns
     */
    Grid.prototype.hasRightContainerColumns = function () {
      return this.hasRightContainer() && this.renderContainers.right.renderedColumns.length > 0;
    };

    // Turn the scroll position into a percentage and make it an argument for a scroll event
    function getScrollPercentage(scrollPixels, scrollLength) {
      var percentage = scrollPixels / scrollLength;

      // if the percentage is greater than 1, set it to 1
      return percentage <= 1 ? percentage : 1;
    }

    // Only returns the scroll Y position if the percentage is different from the previous
    function getScrollY(scrollPixels, scrollLength, prevScrolltopPercentage) {
      var scrollPercentage = getScrollPercentage(scrollPixels, scrollLength);

      if (scrollPercentage !== prevScrolltopPercentage) {
        return { percentage: getScrollPercentage(scrollPixels, scrollLength) };
      }

      return undefined;
    }

    // Only returns the scroll X position if the percentage is different from the previous
    function getScrollX(horizScrollPixels, horizScrollLength, prevScrollleftPercentage) {
      var horizPercentage = horizScrollPixels / horizScrollLength;
      horizPercentage = (horizPercentage > 1) ? 1 : horizPercentage;

      if (horizPercentage !== prevScrollleftPercentage) {
        return { percentage: horizPercentage  };
      }

      return undefined;
    }

    /**
     * @ngdoc method
     * @methodOf  ui.grid.class:Grid
     * @name scrollToIfNecessary
     * @description Scrolls the grid to make a certain row and column combo visible,
     *   in the case that it is not completely visible on the screen already.
     * @param {GridRow} gridRow row to make visible
     * @param {GridColumn} gridCol column to make visible
     * @returns {promise} a promise that is resolved when scrolling is complete
     */
    Grid.prototype.scrollToIfNecessary = function (gridRow, gridCol) {
      var self = this;

      var scrollEvent = new ScrollEvent(self, 'uiGrid.scrollToIfNecessary');

      // Alias the visible row and column caches
      var visRowCache = self.renderContainers.body.visibleRowCache;
      var visColCache = self.renderContainers.body.visibleColumnCache;

      /*-- Get the top, left, right, and bottom "scrolled" edges of the grid --*/

      // The top boundary is the current Y scroll position
      var topBound = self.renderContainers.body.prevScrollTop;

      // Don't the let top boundary be less than 0
      topBound = (topBound < 0) ? 0 : topBound;

      // The left boundary is the current X scroll position
      var leftBound = self.renderContainers.body.prevScrollLeft;

      // The bottom boundary is the current Y scroll position, plus the height of the grid, but minus the header height.
      //   Basically this is the viewport height added on to the scroll position
      var bottomBound = self.renderContainers.body.prevScrollTop + self.gridHeight - self.renderContainers.body.headerHeight - self.footerHeight -  self.scrollbarHeight;

      // If there's a horizontal scrollbar, remove its height from the bottom boundary, otherwise we'll be letting it obscure rows
      // if (self.horizontalScrollbarHeight) {
      //   bottomBound = bottomBound - self.horizontalScrollbarHeight;
      // }

      // The right position is the current X scroll position minus the grid width
      var rightBound = self.renderContainers.body.prevScrollLeft + Math.ceil(self.renderContainers.body.getViewportWidth());

      // If there's a vertical scrollbar, subtract it from the right boundary or we'll allow it to obscure cells
      // if (self.verticalScrollbarWidth) {
      //   rightBound = rightBound - self.verticalScrollbarWidth;
      // }

      // We were given a row to scroll to
      if (gridRow !== null) {
        // This is the index of the row we want to scroll to, within the list of rows that can be visible
        var seekRowIndex = visRowCache.indexOf(gridRow);

        // Total vertical scroll length of the grid
        var scrollLength = (self.renderContainers.body.getCanvasHeight() - self.renderContainers.body.getViewportHeight());

        // Add the height of the native horizontal scrollbar to the scroll length, if it's there. Otherwise it will mask over the final row
        // if (self.horizontalScrollbarHeight && self.horizontalScrollbarHeight > 0) {
        //   scrollLength = scrollLength + self.horizontalScrollbarHeight;
        // }

        // This is the minimum amount of pixels we need to scroll vertical in order to see this row.
        var pixelsToSeeRow = (seekRowIndex * self.options.rowHeight);

        // Don't let the pixels required to see the row be less than zero
        pixelsToSeeRow = (pixelsToSeeRow < 0) ? 0 : pixelsToSeeRow;

        var scrollPixels;

        // If the scroll position we need to see the row is LESS than the top boundary, i.e. obscured above the top of the self...
        if (pixelsToSeeRow < Math.floor(topBound)) {
          // Get the different between the top boundary and the required scroll position and subtract it from the current scroll position\
          //   to get the full position we need
          scrollPixels = self.renderContainers.body.prevScrollTop - (topBound - pixelsToSeeRow);

          // Since scrollIfNecessary is called multiple times when enableCellEditOnFocus is true we need to make sure the scrollbarWidth and
          // footerHeight is accounted for to not cause a loop.
          if (gridCol && gridCol.colDef && gridCol.colDef.enableCellEditOnFocus) {
            scrollPixels = scrollPixels - self.footerHeight - self.scrollbarHeight;
          }

          scrollEvent.y = getScrollY(scrollPixels, scrollLength, self.renderContainers.body.prevScrolltopPercentage);
        }
        // Otherwise if the scroll position we need to see the row is MORE than the bottom boundary, i.e. obscured below the bottom of the self...
        // add the height of one row since scrollPixels points to the top pixel of the row
        else if ((pixelsToSeeRow + self.options.rowHeight) > Math.ceil(bottomBound)) {
          // Get the different between the bottom boundary and the required scroll position and add it to the current scroll position
          // plus the height of one row since scrollPixels points to the top pixel of the row
          // to get the full position we need
          scrollPixels = (pixelsToSeeRow + self.options.rowHeight) - bottomBound + self.renderContainers.body.prevScrollTop;

          // Scroll to full position
          scrollEvent.y = getScrollY(scrollPixels, scrollLength, self.renderContainers.body.prevScrolltopPercentage);
        }
      }

      // We were given a column to scroll to
      if (gridCol !== null) {
        // This is the index of the column we want to scroll to, within the list of columns that can be visible
        var seekColumnIndex = visColCache.indexOf(gridCol);

        // Total horizontal scroll length of the grid
        var horizScrollLength = (self.renderContainers.body.getCanvasWidth() - self.renderContainers.body.getViewportWidth());

        // This is the minimum amount of pixels we need to scroll horizontal in order to see this column
        var columnLeftEdge = 0;
        for (var i = 0; i < seekColumnIndex; i++) {
          var col = visColCache[i];
          columnLeftEdge += col.drawnWidth;
        }
        columnLeftEdge = (columnLeftEdge < 0) ? 0 : columnLeftEdge;

        var columnRightEdge = columnLeftEdge + gridCol.drawnWidth;

        // Don't let the pixels required to see the column be less than zero
        columnRightEdge = (columnRightEdge < 0) ? 0 : columnRightEdge;

        var horizScrollPixels;

        // If the scroll position we need to see the column is LESS than the left boundary, i.e. obscured before the left of the self...
        if (columnLeftEdge < leftBound) {
          // Get the different between the left boundary and the required scroll position and subtract it from the current scroll position\
          //   to get the full position we need
          horizScrollPixels = self.renderContainers.body.prevScrollLeft - (leftBound - columnLeftEdge);

          // Turn the scroll position into a percentage and make it an argument for a scroll event
          scrollEvent.x = getScrollX(horizScrollPixels, horizScrollLength, self.renderContainers.body.prevScrollleftPercentage);
        }
        // Otherwise if the scroll position we need to see the column is MORE than the right boundary, i.e. obscured after the right of the self...
        else if (columnRightEdge > rightBound) {
          // Get the different between the right boundary and the required scroll position and add it to the current scroll position
          //   to get the full position we need
          horizScrollPixels = columnRightEdge - rightBound + self.renderContainers.body.prevScrollLeft;

          // Turn the scroll position into a percentage and make it an argument for a scroll event
          scrollEvent.x = getScrollX(horizScrollPixels, horizScrollLength, self.renderContainers.body.prevScrollleftPercentage);
        }
      }

      var deferred = $q.defer();

      // If we need to scroll on either the x or y axes, fire a scroll event
      if (scrollEvent.y || scrollEvent.x) {
        scrollEvent.withDelay = false;
        self.scrollContainers('',scrollEvent);
        var dereg = self.api.core.on.scrollEnd(null,function() {
          deferred.resolve(scrollEvent);
          dereg();
        });
      }
      else {
        deferred.resolve();
      }

      return deferred.promise;
    };

    /**
     * @ngdoc method
     * @methodOf ui.grid.class:Grid
     * @name scrollTo
     * @description Scroll the grid such that the specified
     * row and column is in view
     * @param {object} rowEntity gridOptions.data[] array instance to make visible
     * @param {object} colDef to make visible
     * @returns {promise} a promise that is resolved after any scrolling is finished
     */
    Grid.prototype.scrollTo = function (rowEntity, colDef) {
      var gridRow = null, gridCol = null;

      if (rowEntity !== null && typeof(rowEntity) !== 'undefined' ) {
        gridRow = this.getRow(rowEntity);
      }

      if (colDef !== null && typeof(colDef) !== 'undefined' ) {
        gridCol = this.getColumn(colDef.name ? colDef.name : colDef.field);
      }
      return this.scrollToIfNecessary(gridRow, gridCol);
    };

  /**
   * @ngdoc function
   * @name clearAllFilters
   * @methodOf ui.grid.class:Grid
   * @description Clears all filters and optionally refreshes the visible rows.
   * @param {object} refreshRows Defaults to true.
   * @param {object} clearConditions Defaults to false.
   * @param {object} clearFlags Defaults to false.
   * @returns {promise} If `refreshRows` is true, returns a promise of the rows refreshing.
   */
  Grid.prototype.clearAllFilters = function clearAllFilters(refreshRows, clearConditions, clearFlags) {
    // Default `refreshRows` to true because it will be the most commonly desired behaviour.
    if (refreshRows === undefined) {
      refreshRows = true;
    }
    if (clearConditions === undefined) {
      clearConditions = false;
    }
    if (clearFlags === undefined) {
      clearFlags = false;
    }

    this.columns.forEach(function(column) {
      column.filters.forEach(function(filter) {
        filter.term = undefined;

        if (clearConditions) {
          filter.condition = undefined;
        }

        if (clearFlags) {
          filter.flags = undefined;
        }
      });
    });

    if (refreshRows) {
      return this.refreshRows();
    }
  };


      // Blatantly stolen from Angular as it isn't exposed (yet? 2.0?)
  function RowHashMap() {}

  RowHashMap.prototype = {
    /**
     * Store key value pair
     * @param key key to store can be any type
     * @param value value to store can be any type
     */
    put: function(key, value) {
      this[this.grid.options.rowIdentity(key)] = value;
    },

    /**
     * @param key
     * @returns {Object} the value for the key
     */
    get: function(key) {
      return this[this.grid.options.rowIdentity(key)];
    },

    /**
     * Remove the key/value pair
     * @param key
     */
    remove: function(key) {
      var value = this[key = this.grid.options.rowIdentity(key)];
      delete this[key];
      return value;
    }
  };

  return Grid;
}]);
})();

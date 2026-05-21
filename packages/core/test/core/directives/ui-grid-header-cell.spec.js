describe('uiGridHeaderCell', function() {
	'use strict';

	var grid, $scope, $compile, $document, $timeout, recompile, uiGridConstants, gridUtil, $httpBackend,
		downEvent, clickEvent,
		data = [
			{name: 'Ethel Price', gender: 'female', company: 'Enersol'},
			{name: 'Claudine Neal', gender: 'female', company: 'Sealoud'},
			{name: 'Beryl Rice', gender: 'female', company: 'Velity'},
			{name: 'Wilder Gonzales', gender: 'male', company: 'Geekko'}
		],
		columnDefs = [
			{name: 'name', headerCellClass: 'testClass'},
			{
				name: 'gender',
				headerCellClass: function(grid, row, col) {
					if (col.colDef.noClass) {
						return '';
					}
					return 'funcCellClass';
				}
			},
			{name: 'company'}
		];

	beforeEach(function() {
		module('ui.grid');

		inject(function(_$compile_, $rootScope, _$document_, _$timeout_, _uiGridConstants_, _gridUtil_, _$httpBackend_) {
			$scope = $rootScope;
			$compile = _$compile_;
			$document = _$document_;
			$timeout = _$timeout_;
			uiGridConstants = _uiGridConstants_;
			gridUtil = _gridUtil_;
			$httpBackend = _$httpBackend_;
		});

		// Decide whether to use mouse or touch events based on which capabilities the browser has
		if (gridUtil.isTouchEnabled()) {
			downEvent = 'touchstart';
			clickEvent = 'touchstart';
		} else {
			downEvent = 'mousedown';
			clickEvent = 'click';
		}

		$scope.gridOpts = {
			enableSorting: true,
			columnDefs: columnDefs,
			data: data,
			showGridFooter: false,
			onRegisterApi: function(gridApi) {
				$scope.gridApi = gridApi;
			}
		};

		$scope.extScope = 'test';

		recompile = function() {
			grid = angular.element('<div style="width: 500px; height: 300px" ui-grid="gridOpts"></div>');

			$compile(grid)($scope);
			$document[0].body.appendChild(grid[0]);

			$scope.$apply();
		};

		recompile();
	});

	afterEach(function() {
		grid.remove();
	});

	describe('column menu', function() {
		var headerCell1,
			headerCell2,
			menu;

		beforeEach(function() {
			headerCell1 = $(grid).find('.ui-grid-header-cell:nth(0) .ui-grid-cell-contents');
			headerCell2 = $(grid).find('.ui-grid-header-cell:nth(1) .ui-grid-cell-contents');

			menu = $(grid).find('.ui-grid-column-menu');
		});

		function openMenu() {
			headerCell1.trigger(downEvent);
			$scope.$digest();
			$timeout.flush();
			$scope.$digest();
		}

		describe('showing a menu with long-click', function() {
			it('should open the menu', inject(function() {
				openMenu();
				expect(menu.find('.ui-grid-menu-inner').length).toEqual(1, 'column menu is visible (the inner is present)');
			}));
		});

		describe('right click', function() {
			it('should do nothing', inject(function() {
				expect(menu.find('.ui-grid-menu-inner').length).toEqual(0, 'column menu is not initially visible');

				headerCell1.trigger({type: downEvent, button: 3});

				$timeout.flush();
				$scope.$digest();

				expect(menu.find('.ui-grid-menu-inner').length).toEqual(0, 'column menu is not visible');
			}));
		});

		describe('clicking outside visible menu', function() {
			it('should close the menu', inject(function() {
				openMenu();
				expect(menu.find('.ui-grid-menu-inner').length).toEqual(1, 'column menu is visible');

				$document.trigger(clickEvent);

				$timeout.flush();
				$scope.$digest();

				expect(menu.find('.ui-grid-menu-inner').length).toEqual(0, 'column menu is not visible');
			}));
		});

		describe('when window is resized', function() {
			it('should hide an open menu', function() {
				openMenu();
				expect(menu.find('.ui-grid-menu-inner').length).toEqual(1, 'column menu is visible');

				$(window).trigger('resize');
				$scope.$digest();

				$timeout.flush();
				$scope.$digest();

				expect(menu.find('.ui-grid-menu-inner').length).toEqual(0, 'column menu is not visible');
			});
		});

		describe('with enableColumnMenu off', function() {
			it('should not be present', function() {
				$scope.gridOpts.enableColumnMenus = false;
				recompile();

				menu = $(grid).find('.ui-grid-column-menu .ui-grid-menu-inner');

				expect(menu[0]).toBeUndefined('menu is undefined');

				var headers = $(grid).find('.ui-grid-column-menu-button');
				expect(headers.length).toEqual(0);
			});
		});

		describe('with colDef.enableColumnMenu false', function() {
			it('should not be present', function() {
				$scope.gridOpts.columnDefs[0].enableColumnMenu = false;
				recompile();

				var headers = $(grid).find('.ui-grid-column-menu-button');
				expect(headers.length).toEqual(2);
			});
		});

		describe('accessibility attributes', function() {
			it('should use a descriptive label and menu popup type for the column menu button', function() {
				var menuButton = $(grid).find('.ui-grid-column-menu-button').first();

				expect(menuButton.attr('aria-label')).toEqual('Column options');
				expect(menuButton.attr('aria-haspopup')).toEqual('menu');
			});
		});
		// TODO(c0bra): Allow extra items to be added to a column menu through columnDefs
	});

	describe('headerCellClass', function() {
		var headerCell1,
			headerCell2;

		beforeEach(function() {
			headerCell1 = $(grid).find('.ui-grid-header-cell:nth(0)');
			headerCell2 = $(grid).find('.ui-grid-header-cell:nth(1)');
		});

		it('should have the headerCellClass class, from string', inject(function() {
			expect(headerCell1.hasClass('testClass')).toBe(true);
		}));

		it('should get cellClass from function, and remove it when data changes', inject(function() {
			expect(headerCell2.hasClass('funcCellClass')).toBe(true);
			columnDefs[1].noClass = true;
			$scope.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
			expect(headerCell2.hasClass('funcCellClass')).toBe(false);
		}));
	});

	describe('isLastCol', function() {
		it('should not add a last col class to the last column when the grid menu is disabled', function() {
			expect($(grid).find('.ui-grid-header-cell:nth(2) .sortable').hasClass('ui-grid-header-cell-last-col')).toBe(false);
		});
		it('should not add a last col class to a column that is not the last column', function() {
			expect($(grid).find('.ui-grid-header-cell:nth(1) .sortable').hasClass('ui-grid-header-cell-last-col')).toBe(false);
		});
	});

	describe('externalScope', function() {
		it('should be present', function() {
			var header = $(grid).find('.ui-grid-header-cell:nth(0)');

			expect(header).toBeDefined();
			expect(header.scope().grid.appScope).toBeDefined();
			expect(header.scope().grid.appScope.extScope).toBe('test');
		});
	});

	describe('should handle a URL-based template defined in headerCellTemplate', function() {
		var el, url;

		beforeEach(function() {
			url = 'http://www.a-really-fake-url.com/headerCellTemplate.html';

			$scope.gridOpts.columnDefs[0].headerCellTemplate = url;
		});
		afterEach(function() {
			$scope.gridOpts.columnDefs[0].headerCellTemplate = undefined;
		});
		it('should handle', function() {
			$httpBackend.expectGET(url).respond('<div class="headerCellTemplate">headerCellTemplate content</div>');
			recompile();

			el = $(grid).find('.headerCellTemplate');
			expect(el.text()).toEqual('');

			$httpBackend.flush();
			el = $(grid).find('.headerCellTemplate');
			expect(el.text()).toEqual('headerCellTemplate content');
		});
	});

	describe('on click', function() {
		var event;

		beforeEach(function() {
			event = new $.Event('click');

			spyOn(event, 'stopPropagation').and.callThrough();
			$(grid).find('.ui-grid-header:nth(0) .ui-grid-cell-contents').trigger(event);
		});
		afterEach(function() {
			event.stopPropagation.calls.reset();
		});
		it('should stop propagation', function() {
			expect(event.stopPropagation).toHaveBeenCalled();
		});
	});

	describe('on keydown', function() {
		var event, headerCellArrow, headerCellContents;

		beforeEach(function() {
			event = new $.Event('keydown');
			headerCellArrow = $(grid).find('.ui-grid-header:nth(0) .ui-grid-column-menu-button');
			headerCellContents = $(grid).find('.ui-grid-header:nth(0) .ui-grid-cell-contents');
		});

		describe('on space on the header cell contents', function() {
			beforeEach(function() {
				event.keyCode = uiGridConstants.keymap.SPACE;

				spyOn(event, 'preventDefault').and.callThrough();
				headerCellContents.trigger(event);
			});
			afterEach(function() {
				event.preventDefault.calls.reset();
			});
			it('should prevent default', function() {
				expect(event.preventDefault).toHaveBeenCalled();
			});
		});

		describe('on enter on the header cell contents', function() {
			beforeEach(function() {
				event.keyCode = uiGridConstants.keymap.ENTER;

				spyOn(event, 'preventDefault').and.callThrough();
				headerCellContents.trigger(event);
			});
			afterEach(function() {
				event.preventDefault.calls.reset();
			});
			it('should prevent default', function() {
				expect(event.preventDefault).toHaveBeenCalled();
			});
		});

		describe('on space on the header cell arrow', function() {
			beforeEach(function() {
				event.keyCode = uiGridConstants.keymap.SPACE;

				spyOn(event, 'preventDefault').and.callThrough();
				spyOn(event, 'stopPropagation').and.callThrough();
				headerCellArrow.trigger(event);
			});
			afterEach(function() {
				event.preventDefault.calls.reset();
				event.stopPropagation.calls.reset();
			});
			it('should prevent default and stop propagation', function() {
				expect(event.preventDefault).toHaveBeenCalled();
				expect(event.stopPropagation).toHaveBeenCalled();
			});
		});

		describe('on enter on the header cell arrow', function() {
			beforeEach(function() {
				event.keyCode = uiGridConstants.keymap.ENTER;

				spyOn(event, 'preventDefault').and.callThrough();
				spyOn(event, 'stopPropagation').and.callThrough();
				headerCellArrow.trigger(event);
			});
			afterEach(function() {
				event.preventDefault.calls.reset();
				event.stopPropagation.calls.reset();
			});
			it('should prevent default and stop propagation', function() {
				expect(event.preventDefault).toHaveBeenCalled();
				expect(event.stopPropagation).toHaveBeenCalled();
			});
		});

		describe('on left arrow on the header cell arrow', function() {
			beforeEach(function() {
				event.keyCode = uiGridConstants.keymap.LEFT;

				spyOn(event, 'preventDefault').and.callThrough();
				spyOn(event, 'stopPropagation').and.callThrough();
				headerCellArrow.trigger(event);
			});
			afterEach(function() {
				event.preventDefault.calls.reset();
				event.stopPropagation.calls.reset();
			});
			it('should not prevent default and stop propagation', function() {
				expect(event.preventDefault).not.toHaveBeenCalled();
				expect(event.stopPropagation).not.toHaveBeenCalled();
			});
		});
	});
});

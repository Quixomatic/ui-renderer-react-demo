/**
 * @property {boolean} [hideInlineEditing=undefined] - Disables inline editing if true
 * @property {boolean} [hideCellFilter=undefined] - Show or hide cell level filters
 * @property {boolean} [hideCheckboxHover=undefined] - Disable checkbox hover behavior
 * @property {boolean} [hideColumnFiltering=undefined] - show or hide column level filters
 * @property {boolean} [hideColumnGrouping=undefined] - show or hide column grouping and associated declarative actions
 * @property {boolean} [hideColumnReorder=false] - sets whether to allow a user to reorder a column by dragging it to a different position
 * @property {boolean} [hideColumnResizing=undefined] - show or hide column resizing sliders and reset widths button
 * @property {boolean} [hideColumnSorting=undefined] - disable column sorting at grid headers
 * @property {boolean} [hideConditionBuilder=true] - disable the display of the condition builder
 * @property {boolean} [hideDotwalk=false] - disable dot-walk behavior
 * @property {boolean} [hideDragDrop=undefined] - disable drag-drop behavior
 * @property {boolean} [hideFilterPanel=undefined] - show or hide filter panel and filter panel toggle button
 * @property {boolean} [hideFirstPage=undefined] - show or hide pagination component first page button
 * @property {boolean} [hideHeader=undefined] -  show or hide list header
 * @property {boolean} [hideLastPage=undefined] - show or hide pagination component last page button
 * @property {boolean} [hideLastRefreshedText=undefined] - show or hide last refreshed text
 * @property {boolean} [hideLimitSelector=undefined] - show or hide pagination component page limit selector
 * @property {boolean} [hideLinks=undefined] - show or hide links in rows
 * @property {boolean} [hideListSharing=undefined] - show or hide copy url button
 * @property {boolean} [hideLiveList=true] - disable or enable live list as a feature
 * @property {boolean} [hideMenuButton=undefined] - show or hide menu button
 * @property {boolean} [hideMultiEdit=undefined] - show or hide multi record edit and associated declarative actions
 * @property {boolean} [hideDeclarativeActions=undefined] - show or hide declarative actions
 * @property {boolean} [hideNextPage=undefined] - show or hide pagination component next page button
 * @property {boolean} [hidePages=undefined] - show or hide pagination component's pages
 * @property {boolean} [hidePagination=undefined] - show or hide pagination component
 * @property {boolean} [hidePanel=undefined] - show or hide panel
 * @property {boolean} [hidePersonalization=false] - show or hide column personalization
 * @property {boolean} [hidePanelAdvanced=undefined] - show or hide filter panel advanced filter toggle button
 * @property {boolean} [hidePanelConditionDelete=undefined] - show or hide filter panel condition delete buttons on pills
 * @property {boolean} [hidePanelFooter=undefined] - show or hide filter panel footer
 * @property {boolean} [hidePanelRestore=undefined] - show or hide filter panel restore defaults button
 * @property {boolean} [hidePreviousPage=undefined] - show or hide pagination component previous page button
 * @property {boolean} [hideQuickEdit=undefined] - show or hide quick edit and associated declarative actions
 * @property {boolean} [hideRange=undefined] - show or hide pagination component range
 * @property {boolean} [hideRefreshButton=undefined] - show or hide refresh button
 * @property {boolean} [hideRowCount=undefined] - show or hide pagination component row count
 * @property {boolean} [hideRowSelector=undefined] - show or hide row selector checkboxes
 * @property {boolean} [hideSelectAll=undefined] - show or hide select all checkbox
 * @property {boolean} [hideShiftRecordSelection=undefined] - show or hide shift-click row selector checkbox behavior
 * @property {boolean} [hideTitle=undefined] - show or hide title in list header
 * @property {boolean} [hideTitleRowCount=undefined] - show or hide row count in list header
 * @property {boolean} [hideDBViews=undefined] - show or hide database views feature
 * @property {boolean} [hideHighlightContent=false] - disable or enable highlight content on cell
 * @property {boolean} [hideHighlightedValues=undefined] - show or hide highlightedValues for cell
 * @property {boolean} [hideEmptyStateImage=undefined] - show or hide the empty state image for list
 * @property {boolean} [hideViewAll=undefined] - show or hide the 'View All' link in the list footer
 * @property {string}  [headerSize=undefined] - configure the size of the header
 * @property {number}  [headingLevel=undefined] - configure the heading level
 * @property {boolean} [hideOptionToSaveAs=undefined] - Controls whether users have the option to save an existing list as a 'My List'
 * @property {boolean} [overrideWordWrapUserPref=false] - Select to override the word wrap user preference and always observe the word wrap property
 */

const emptyFeatureFlags = {
	name: 'emptyFeatureFlags',
	properties: {
		hideInlineEditing: {},
		hideCellFilter: {},
		hideCheckboxHover: {},
		hideColumnFiltering: {},
		hideColumnGrouping: {},
		hideColumnReorder: {},
		hideColumnResizing: {},
		hideColumnSorting: {},
		hideConditionBuilder: {},
		hideDotwalk: {},
		hideDragDrop: {},
		hideFilterPanel: {},
		hideFirstPage: {},
		hideHeader: {},
		hideLastPage: {},
		hideLastRefreshedText: {},
		hideLimitSelector: {},
		hideLinks: {},
		hideListSharing: {},
		hideLiveList: {},
		hideMenuButton: {},
		hideMultiEdit: {},
		hideDeclarativeActions: {},
		hideNextPage: {},
		hidePages: {},
		hidePersonalization: {},
		hidePagination: {},
		hidePanel: {},
		hidePanelAdvanced: {},
		hidePanelConditionDelete: {},
		hidePanelFooter: {},
		hidePanelRestore: {},
		hidePreviousPage: {},
		hideQuickEdit: {},
		hideRange: {},
		hideRefreshButton: {},
		hideRowCount: {},
		hideRowSelector: {},
		hideSelectAll: {},
		hideShiftRecordSelection: {},
		hideTitle: {},
		hideTitleRowCount: {},
		hideDBViews: {},
		hideHighlightContent: {default: false},
		hideHighlightedValues: {},
		hideEmptyStateImage: {},
		hideViewAll: {},
		hideUnnecessaryRowSelectors: {},
		headerSize: {},
		headingLevel: {},
		hideOptionToSaveAs: {},
		overrideWordWrapUserPref: {default: false}
	}
};

export default emptyFeatureFlags;

/**
 * @property {boolean} [hideInlineEditing=true] - Disables inline editing if true
 * @property {boolean} [hideCellFilter=true] - Show or hide cell level filters
 * @property {boolean} [hideCheckboxHover=true] - Disable checkbox hover behavior
 * @property {boolean} [hideColumnFiltering=true] - show or hide column level filters
 * @property {boolean} [hideColumnGrouping=false] - show or hide column grouping and associated declarative actions
 * @property {boolean} [hideColumnReorder=false] - sets whether to allow a user to reorder a column by dragging it to a different position
 * @property {boolean} [hideColumnResizing=true] - show or hide column resizing sliders and reset widths button
 * @property {boolean} [hideColumnSorting=false] - disable column sorting at grid headers
 * @property {boolean} [hideConditionBuilder=true] - disable the display of the condition builder
 * @property {boolean} [hideDotwalk=true] - disable dot-walk behavior
 * @property {boolean} [hideDragDrop=false] - disable drag-drop behavior
 * @property {boolean} [hideFilterPanel=false] - show or hide filter panel and filter panel toggle button
 * @property {boolean} [hideFirstPage=false] - show or hide pagination component first page button
 * @property {boolean} [hideHeader=false] -  show or hide list header
 * @property {boolean} [hideLastPage=false] - show or hide pagination component last page button
 * @property {boolean} [hideLastRefreshedText=false] - show or hide last refreshed text
 * @property {boolean} [hideLimitSelector=false] - show or hide pagination component page limit selector
 * @property {boolean} [hideLinks=false] - show or hide links in rows
 * @property {boolean} [hideListSharing=true] - show or hide copy url button
 * @property {boolean} [hideLiveList=true] - disable or enable live list as a feature
 * @property {boolean} [hideMenuButton=true] - show or hide menu button
 * @property {boolean} [hideMultiEdit=false] - show or hide multi record edit and associated declarative actions
 * @property {boolean} [hideDeclarativeActions=false] - show or hide declarative actions
 * @property {boolean} [hideNextPage=false] - show or hide pagination component next page button
 * @property {boolean} [hidePages=false] - show or hide pagination component's pages
 * @property {boolean} [hidePagination=true] - show or hide pagination component
 * @property {boolean} [hidePanel=true] - show or hide panel
 * @property {boolean} [hidePersonalization=true] - show or hide column personalization
 * @property {boolean} [hidePanelAdvanced=false] - show or hide filter panel advanced filter toggle button
 * @property {boolean} [hidePanelConditionDelete=false] - show or hide filter panel condition delete buttons on pills
 * @property {boolean} [hidePanelFooter=false] - show or hide filter panel footer
 * @property {boolean} [hidePanelRestore=false] - show or hide filter panel restore defaults button
 * @property {boolean} [hidePreviousPage=false] - show or hide pagination component previous page button
 * @property {boolean} [hideQuickEdit=true] - show or hide quick edit and associated declarative actions
 * @property {boolean} [hideRange=false] - show or hide pagination component range
 * @property {boolean} [hideRefreshButton=false] - show or hide refresh button
 * @property {boolean} [hideRowCount=false] - show or hide pagination component row count
 * @property {boolean} [hideRowSelector=false] - show or hide row selector checkboxes
 * @property {boolean} [hideSelectAll=false] - show or hide select all checkbox
 * @property {boolean} [hideShiftRecordSelection=false] - show or hide shift-click row selector checkbox behavior
 * @property {boolean} [hideTitle=false] - show or hide title in list header
 * @property {boolean} [hideTitleRowCount=false] - show or hide row count in list header
 * @property {boolean} [hideDBViews=true] - show or hide database views feature
 * @property {boolean} [hideHighlightContent=false] - disable or enable highlight content on cell
 * @property {boolean} [hideHighlightedValues=true] - show or hide highlightedValues for cell
 * @property {boolean} [hideEmptyStateImage=true] - show or hide the empty state image for list
 * @property {boolean} [hideViewAll=false] - show or hide the 'View All' link in the list footer
 * @property {string}  [headerSize='sm'] - configure the size of the header
 * @property {number}  [headingLevel=3] - configure the heading level
 * @property {boolean} [hideOptionToSaveAs=false] - Controls whether users have the option to save an existing list as a 'My List'
 * @property {boolean} [overrideWordWrapUserPref=false] - Select to override the word wrap user preference and always observe the word wrap property
 */
const snapshotFeatureFlags = {
	name: 'snapshotFeatureFlags',
	properties: {
		hideInlineEditing: {default: true},
		hideCellFilter: {default: true},
		hideCheckboxHover: {default: true},
		hideColumnFiltering: {default: true},
		hideColumnGrouping: {default: true},
		hideColumnReorder: {default: false},
		hideColumnResizing: {default: true},
		hideColumnSorting: {default: false},
		hideConditionBuilder: {default: true},
		hideDotwalk: {default: true},
		hideDragDrop: {default: true},
		hideFilterPanel: {default: false},
		hideFirstPage: {default: false},
		hideHeader: {default: false},
		hideLastPage: {default: false},
		hideLastRefreshedText: {default: false},
		hideLimitSelector: {default: false},
		hideLinks: {default: false},
		hideListSharing: {default: true},
		hideLiveList: {default: true},
		hideMenuButton: {default: true},
		hideMultiEdit: {default: false},
		hideDeclarativeActions: {default: false},
		hideNextPage: {default: false},
		hidePages: {default: false},
		hidePagination: {default: true},
		hidePanel: {default: true},
		hidePanelAdvanced: {default: false},
		hidePanelConditionDelete: {default: false},
		hidePanelFooter: {default: false},
		hidePanelRestore: {default: false},
		hidePreviousPage: {default: false},
		hidePersonalization: {default: true},
		hideQuickEdit: {default: true},
		hideRange: {default: false},
		hideRefreshButton: {default: false},
		hideRowCount: {default: false},
		hideRowSelector: {default: false},
		hideSelectAll: {default: false},
		hideShiftRecordSelection: {default: false},
		hideTitle: {default: false},
		hideTitleRowCount: {default: false},
		hideDBViews: {default: true},
		hideHighlightContent: {default: false},
		hideHighlightedValues: {default: true},
		hideEmptyStateImage: {default: true},
		hideViewAll: {default: false},
		hideUnnecessaryRowSelectors: {default: true},
		headerSize: {default: 'sm'},
		headingLevel: {default: 3},
		hideOptionToSaveAs: {default: false},
		overrideWordWrapUserPref: {default: false}
	}
};

export default snapshotFeatureFlags;

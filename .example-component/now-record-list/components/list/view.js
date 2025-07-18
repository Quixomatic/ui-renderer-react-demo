import '@servicenow/now-badge';
import '@servicenow/now-collapse';
import '@servicenow/now-condition-builder';
import '@servicenow/now-grid';
import '@servicenow/now-icon';
import '@servicenow/now-button';
import '@servicenow/now-pagination';
import '@servicenow/now-record-list-panel';
import '@servicenow/now-scripting-ui-components';
import '../declarativeActions/wrapper';
import '../grid/grid';
import '../grid/treeGrid';
import '../listErrorState/listErrorState';
import '../listHeaderTitle/listHeaderTitle';
import '../listHeaderToolbar/listHeaderToolbar';
import '../modals/listModal';
import '../slidingMenu/slidingMenuButton';
import '../columnFiltering/container';
import '../columnFiltering/value/valueFilter';

import cx from 'classnames';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import {memoizeDeep} from 'seismic-memo-utils';
import {t} from 'sn-translate';

import {BEHAVIOR_NAME as conditionBuilderBehaviorName} from '../../behaviors/conditionBuilderBehavior';
import {
	BUTTON_CONDITION_BUILDER_RUN,
	FINAL_COUNT,
	IS_OMIT_COUNT,
	LIST_LOADER_SIZE_LG,
	LIST_VIEW_ALL,
	LIST_TYPE_PICKER,
	LIST_TYPE_REFERENCE
} from '../../constants';
import '../listLoader/listLoader';
import '../nowGrid/overlay/components/loadingOverlay';
import {renderSpinnerContainer} from '../../utils/listLoaderHelper';
import {getNonDroppableColumns} from '../nowGrid/columnDragDrop/columnDragDrop';

import {stripOrderBy} from './listModifierUtils';
import {
	getPaginationModel,
	isDynamicEvaluationEnabled,
	isViewAllNeeded,
	shouldDisableSortOnConditionBuilder
} from './listUtils';

const renderErrorState = errorObject => {
	const message = get(errorObject, 'message', '');
	const extraInfo = get(errorObject, 'extraInfo', '');
	return (
		<sn-record-list-state-error message={message} extra-info={extraInfo} />
	);
};

const renderConditionBuilder = (properties, updateState) => {
	const {
		listTitle,
		listModel,
		parsedQueryModel,
		shouldExcludeOperators,
		isFilterOverviewCollapsed,
		filterCount
	} = properties;

	let conditionBuilderQuery = '';
	if (parsedQueryModel.glideQuery) {
		conditionBuilderQuery = stripOrderBy(
			parsedQueryModel.glideQuery.toQueryString()
		);
	}

	const collapsedDirection = isFilterOverviewCollapsed ? 'right' : 'down';
	const triggerHeaderLabel = t('Filter');
	const triggerButtonLabel = t('Filters');

	const tableName = get(listModel, 'layoutQuery.table');

	let hideSortingConditionBuilder = false;
	if (shouldExcludeOperators) {
		hideSortingConditionBuilder = shouldDisableSortOnConditionBuilder(
			listModel
		);
	}

	return (
		<div className="condition-builder-container">
			<now-collapse-trigger
				controls="filter-overview-collapse"
				opened={'true'}
				role="none"
				on-click={() => {
					updateState({
						path: `behaviors.${conditionBuilderBehaviorName}.isFilterOverviewCollapsed`,
						value: !isFilterOverviewCollapsed,
						operation: 'set'
					});
				}}>
				<now-icon icon="filter-outline" />
				<span
					data-truncation
					className="collapse-trigger-label"
					aria-hidden="true">
					{triggerHeaderLabel}
				</span>
				{filterCount > 0 ? (
					<now-badge
						color="blue"
						round={true}
						size="sm"
						value={filterCount}
						variant="secondary"
					/>
				) : null}
				<now-button-iconic
					icon={`chevron-${collapsedDirection}-outline`}
					id="collapse-button"
					tooltipContent={triggerButtonLabel}
					size="md"
					variant="tertiary"
					bare={true}
					hidePadding={true}
					configAria={{
						'aria-expanded': `${!isFilterOverviewCollapsed}`,
						'aria-label': triggerButtonLabel
					}}></now-button-iconic>
			</now-collapse-trigger>
			<now-collapse
				expanded={!isFilterOverviewCollapsed}
				id="filter-overview-collapse">
				<now-condition-builder-connected
					compactMode={true}
					encodedQuery={conditionBuilderQuery}
					hideActionBar={true}
					hideEditorDescription={true}
					hideFilterOverview={true}
					hideLoadFilter={true}
					hideRelatedListQueryConditions={true}
					hideSaveFilter={true}
					hideSortByDescription={true}
					tableLabel={listTitle}
					tableName={tableName}
					shouldExcludeOperators={shouldExcludeOperators}
					hideSortBy={hideSortingConditionBuilder}
				/>
				<div className="action-container">
					<now-button
						component-name={BUTTON_CONDITION_BUILDER_RUN}
						label={t('Run')}
						variant="primary"
						size="md"></now-button>
				</div>
			</now-collapse>
		</div>
	);
};

const memoziedHeaderTitleProps = memoizeDeep(
	headerTitleProps => headerTitleProps
);

const view = (state, {dispatch, updateState}) => {
	let {
		properties: {
			allRecordsSelected,
			cellOverrides: {
				originalSysIds: editedRecords = [],
				cellUpdatedOn = ''
			} = {},
			columns,
			daModel,
			dataUpdatedTime,
			declarativeActions = [],
			directLink,
			hideColumnResizing,
			hideConditionBuilder,
			hideTitleRowCount,
			hideTitle,
			hideLastRefreshedText,
			hideFilterPanel,
			hideHeader,
			hideMenuButton,
			hideDeclarativeActions,
			hideLiveList,
			hidePagination,
			hidePanel,
			error,
			instanceId,
			isListEditable,
			isWorkspace,
			limit,
			listMenuOpen,
			listModel,
			listTitle,
			listType,
			liveLists,
			liveListCount,
			loading,
			maxColumns,
			menuSelection,
			originalConditions,
			panelOpened,
			panelConfig,
			parentRecordSysId,
			parentTable,
			parsedQueryModel,
			relatedListName,
			refreshRequested,
			selectedListId,
			selectedRecords,
			table,
			tableLabel,
			timeAccessed,
			view,
			hideRange,
			hidePages,
			hideRowCount,
			hideFirstPage,
			hidePreviousPage,
			hideNextPage,
			hideLastPage,
			hideLimitSelector,
			hideRefreshButton,
			hideListSharing,
			hideViewAll,
			headerSize,
			headingLevel,
			cascadeDelete,
			useNewConditionBuilder,
			userRoles,
			hideOptionToSaveAs,
			hidePersonalization,
			hideDotwalk,
			conditions,
			shouldExcludeOperators
		},
		templates,
		modalProps,
		pluginStyles = {},
		listCount = {},
		maxGroupsPerPage = 20
	} = state;

	const isScriptableTable = get(
		listModel,
		'tableMetadata.isScriptableTable',
		false
	);

	const {isGrouped = false} = get(listModel, 'tableMetadata.isGrouped', false);

	if (isScriptableTable) error = get(listModel, 'errorMessage', null) || error;

	if (!isEmpty(error))
		return (
			<div className="sn-list-container sn-list-loader-container">
				{renderErrorState(error)}
			</div>
		);

	if ((isEmpty(listModel) && loading) || get(listModel, 'empty', false))
		return (
			<div className="sn-list-container sn-list-loader-container">
				{renderSpinnerContainer(LIST_LOADER_SIZE_LG)}
			</div>
		);

	if (isEmpty(listModel) && !loading) return null;

	const tableName = table[0]
		? `${table[0].toUpperCase()}${table.slice(1).replaceAll('_', ' ')}`
		: '';
	const ariaTable = tableLabel || tableName;
	const ariaTitle = listTitle
		? t('{0} - Table {1}', listTitle, ariaTable)
		: t(`${ariaTable}`);

	const query = get(parsedQueryModel, 'queryString', '');

	const paginationProps = {
		hideRange,
		hidePages,
		hideRowCount,
		hideFirstPage,
		hidePreviousPage,
		hideNextPage,
		hideLastPage,
		hideLimitSelector,
		...getPaginationModel(state.properties, listCount, maxGroupsPerPage)
	};

	// on serverside we are depending on a system property (glide.workspace.lists.max_groups_per_page) for maxGroupPerPage
	// on clientside we are calculating on basis of 1st page row count for displaying the label
	if (isGrouped) {
		updateState({
			path: `maxGroupsPerPage`,
			value: paginationProps.limitOverride,
			operation: 'set',
			shouldRender: false
		});
	}

	const headerTitleProps = memoziedHeaderTitleProps({
		dataUpdatedTime,
		directLink,
		dispatch,
		encodedQueryString: get(listModel, 'encodedQueryString', ''),
		instanceId: instanceId,
		isRefList: false,
		metadata: get(listModel, 'tableMetadata', {}),
		parentTable,
		table,
		timeAccessed
	});

	const toolbarProps = {
		columns,
		isWorkspace,
		hideFilterPanel,
		hideMenuButton,
		hidePanel,
		hideColumnResizing,
		hideRefreshButton,
		hideListSharing,
		hideLiveList,
		isListEditable,
		isTableEmpty:
			!get(listModel, 'columns', []).length &&
			!get(listModel, 'data', []).length,
		listModel,
		listTitle,
		listType,
		liveListCount,
		liveLists,
		menuSelection,
		panelOpened,
		panelConfig,
		parsedQueryCount: parsedQueryModel.count,
		query,
		relatedListName,
		selectedListId,
		size: headerSize,
		table,
		content: get(cascadeDelete, 'cascadeContent', ''),
		hideOptionToSaveAs,
		hidePersonalization,
		listCount
	};

	const hasPanel = !hidePanel && panelOpened;
	const omitCount = get(listModel, IS_OMIT_COUNT, false);

	const {
		panelTitle,
		panelSize,
		panelSlot,
		renderPanelHeader,
		hidePadding
	} = panelConfig;

	const finalCount = get(listModel, FINAL_COUNT, false);
	const colDefs = state.options.recordData.colDefs || [];
	const selectedColumns = colDefs
		.filter(colDef => {
			return !getNonDroppableColumns().includes(colDef.field);
		})
		.map(colDef => {
			return {
				id: colDef.field,
				label: colDef.columnData.fullLabel
					? colDef.columnData.fullLabel.replace(/\./g, ' > ')
					: colDef.columnData.label
			};
		});
	const selectedColumnsWidth =
		(state.options.colResizing && state.options.colResizing.columnSizesArray) ||
		[];
	const listModalProps = {
		columns,
		isWorkspace,
		listTitle,
		originalConditions,
		query,
		selectedListId,
		table,
		useNewConditionBuilder,
		userRoles,
		...modalProps,
		selectedColumns,
		selectedColumnsWidth,
		listModel,
		menuSelection,
		view,
		maxColumns,
		hideDotwalk,
		parentTable,
		relatedListName,
		shouldExcludeOperators
	};
	const hideModal = !get(listModalProps, 'type', '');
	const shouldShowConditionBuilder =
		!hideConditionBuilder &&
		[LIST_TYPE_REFERENCE, LIST_TYPE_PICKER].includes(listType);

	const {filterCount, isFilterOverviewCollapsed} = get(
		state.behaviors,
		conditionBuilderBehaviorName,
		{}
	);

	const snListContainerClassNames = cx('sn-list-container', {
		'--condition-builder': shouldShowConditionBuilder
	});

	const snGridContainerClassNames = cx('sn-list-grid-container', {
		'--expanded': shouldShowConditionBuilder && !isFilterOverviewCollapsed
	});

	//get recordSysIds of all rows in state
	const recordSysIds = get(state, 'options.recordData.data', [])
		.map(row => row.rowMetaData?.uniqueId)
		.filter(id => id !== undefined);

	//check if Dynamic Evaluation is needed for atleast one of the DA
	const dynamicEvaluationEnabled = isDynamicEvaluationEnabled(
		declarativeActions
	);

	return (
		<div className={snListContainerClassNames}>
			{shouldShowConditionBuilder
				? renderConditionBuilder(
						{
							isFilterOverviewCollapsed,
							filterCount,
							listModel,
							listTitle,
							parsedQueryModel,
							shouldExcludeOperators
						},
						updateState
				  )
				: null}

			{!hideModal ? <sn-record-list-modal modalProps={listModalProps} /> : null}
			{!hideHeader ? (
				<div className="sn-list-header">
					{menuSelection ? (
						<sn-record-list-header-button-slide-menu
							menu-opened={listMenuOpen}
						/>
					) : null}
					<sn-record-list-header-title
						ariaTitle={ariaTitle}
						headerTitleProps={headerTitleProps}
						listTitle={listTitle}
						listCount={listCount}
						hideTitleRowCount={hideTitleRowCount}
						hideTitle={hideTitle}
						hideLastRefreshedText={hideLastRefreshedText}
						headerSize={headerSize}
						headingLevel={headingLevel}
						omitCount={omitCount}
						finalCount={finalCount}
						liveLists={liveLists}
					/>
					<sn-record-list-declarative-actions-wrapper
						toolbarProps={toolbarProps}
						hideDeclarativeActions={hideDeclarativeActions}
						declarativeActions={declarativeActions}
						daModel={daModel}
						isWorkspace={isWorkspace}
						dynamicEvaluationEnabled={dynamicEvaluationEnabled}
						table={table}
						parentTable={parentTable}
						parentRecordSysId={parentRecordSysId}
						selectedRecords={selectedRecords}
						editedRecords={editedRecords}
						cellUpdatedOn={cellUpdatedOn}
						recordSysIds={recordSysIds}
						allRecordsSelected={allRecordsSelected}
						conditions={conditions}
						refreshRequested={refreshRequested}
					/>
				</div>
			) : null}
			<div className={snGridContainerClassNames}>
				<div className="sn-list">
					<div className="listHeight">
						{loading ? <now-grid-overlay-loader /> : null}
						<now-grid
							caption={listTitle}
							columns={state.options.recordData.colDefs}
							headingLevel={headingLevel}
							rowData={state.options.recordData.data}
							templates={templates}
							tableLayout={get(
								state,
								'behaviors.colResizing.tableStyleType.style.tableLayout',
								'auto'
							)}
							styles={{
								container: {style: {height: '100%', maxHeight: '2000px'}},
								...pluginStyles
							}}
						/>
					</div>
				</div>
				{hasPanel ? (
					<now-record-list-panel
						renderPanelHeader={!!renderPanelHeader}
						panelTitle={t(`${panelTitle}`)}
						panelOpened={panelOpened}
						panelSize={panelSize}
						hidePadding={hidePadding}>
						{panelSlot}
					</now-record-list-panel>
				) : null}
			</div>
			<div className="sn-list-footer-container">
				{isViewAllNeeded({hideViewAll, limit, listCount}) ? (
					<div className="view-all-container">
						<now-text-link
							label={t('View All')}
							href="javascript:void(0)"
							configAria={{'aria-label': t('View all {0}', ariaTitle)}}
							append-to-payload={{
								type: LIST_VIEW_ALL
							}}
						/>
					</div>
				) : null}
				{!hidePagination ? (
					<div className="pagination-container">
						<now-pagination {...paginationProps} />
					</div>
				) : null}
			</div>
		</div>
	);
};

export default view;

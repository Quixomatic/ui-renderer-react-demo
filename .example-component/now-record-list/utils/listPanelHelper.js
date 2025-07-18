import '../../src/components/filterConditions/filterConditions';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import {t} from 'sn-translate';

import {stripOrderBy} from '../components/list/listModifierUtils';
import {
	PANEL_TYPE_FILTER,
	PANEL_TYPE_FROM_DA,
	PANEL_TYPE_MULTI_EDIT,
	PANEL_TYPE_QUICK_EDIT
} from '../constants';

export const getListPanelConfig = async properties => {
	const {panelType} = properties;
	let listPanelConfig = {};

	switch (panelType) {
		case PANEL_TYPE_FILTER:
			listPanelConfig = {
				panelType: PANEL_TYPE_FILTER,
				panelTitle: t('Filter'),
				panelSlot: getFilterPanelSlot(properties),
				panelSize: 'sm',
				renderPanelHeader: true,
				hidePadding: true
			};
			break;

		case PANEL_TYPE_QUICK_EDIT:
			await import('../components/formEditWrapper/quickEdit');
			listPanelConfig = {
				panelType: PANEL_TYPE_QUICK_EDIT,
				renderPanelHeader: false,
				panelTitle: t('Quick Edit'),
				panelSlot: getQuickEditSlot(properties),
				panelSize: 'md',
				hidePadding: true
			};
			break;
		case PANEL_TYPE_MULTI_EDIT:
			await import('../components/formEditWrapper/multiEdit');
			listPanelConfig = {
				panelType: PANEL_TYPE_MULTI_EDIT,
				renderPanelHeader: false,
				panelTitle: t('Multi Edit'),
				panelSize: 'sm',
				panelSlot: getMultiEditSlot(properties),
				hidePadding: true
			};
			break;
		case PANEL_TYPE_FROM_DA: {
			const {
				renderPanelHeader,
				panelTitle,
				panelSize,
				hidePadding,
				panelSlot
			} = properties.listPanelConfigFromDA;

			listPanelConfig = {
				panelType: PANEL_TYPE_FROM_DA,
				renderPanelHeader,
				panelTitle,
				panelSize,
				panelSlot: getSlotUsingDeclarativeActions(panelSlot),
				hidePadding
			};
			break;
		}
		default:
			listPanelConfig = {
				panelType: '',
				panelTitle: '',
				panelSlot: null,
				panelSize: 'sm',
				renderPanelHeader: false
			};
			break;
	}

	return listPanelConfig;
};

const getFilterPanelSlot = properties => {
	const {
		fixedQuery,
		hidePanelAdvanced,
		hidePanelConditionDelete,
		hidePanelFooter,
		hidePanelRestore,
		loading,
		originalConditions,
		parsedQueryModel,
		relatedListName,
		table
	} = properties;

	const queryString = stripOrderBy(parsedQueryModel.glideQuery.toQueryString());
	return (
		<filter-conditions
			fixedQuery={fixedQuery}
			hidePanelAdvanced={hidePanelAdvanced}
			hidePanelConditionDelete={hidePanelConditionDelete}
			hidePanelFooter={hidePanelFooter}
			hidePanelRestore={hidePanelRestore}
			loading={loading}
			originalConditions={originalConditions}
			parsedQueryModel={parsedQueryModel}
			query={queryString}
			relatedListName={relatedListName}
			table={table}></filter-conditions>
	);
};

const getQuickEditSlot = properties => {
	const {table, quickEditSysId, workspaceConfigId} = properties;

	return (
		<sn-record-list-quick-edit
			table={table}
			quickEditSysId={quickEditSysId}
			workspaceConfigId={workspaceConfigId}
		/>
	);
};

export const getMultiEditSlot = properties => {
	const {
		selectedRecords,
		table,
		workspaceConfigId,
		allRecordsSelected,
		exceptedRecords,
		listModel: {
			layoutQuery: {allSysIds}
		}
	} = properties;
	if (allRecordsSelected) {
		const selectedRecordsOnPage = allSysIds.filter(
			sysId => !exceptedRecords.includes(sysId)
		);
		const message = t(
			'You can only edit the {0} record(s) selected on this page',
			selectedRecordsOnPage.length
		);

		return (
			<Fragment>
				<now-alert status="info" icon="circle-info-outline" content={message} />
				<sn-record-list-multi-edit
					table={table}
					selectedRecords={selectedRecordsOnPage}
					workspaceConfigId={workspaceConfigId}
				/>
			</Fragment>
		);
	}
	if (!get(selectedRecords, 'length', 0)) return;

	return (
		<sn-record-list-multi-edit
			table={table}
			selectedRecords={selectedRecords}
			workspaceConfigId={workspaceConfigId}
		/>
	);
};

export const getSlotUsingDeclarativeActions = panelSlot => {
	return <div innerHTML={panelSlot}></div>;
};

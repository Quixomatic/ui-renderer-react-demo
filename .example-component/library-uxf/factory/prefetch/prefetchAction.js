import {searchQuerySchema} from './prefetchQueries';
import {get} from '@devsnc/snowdash';
import {getUxGlobal} from '../../templateLoader/utils';

const GRAPHQL_ENDPOINT = '/api/now/graphql';

let snHttpRef;
const snHttp = async () => {
	if (snHttpRef) return snHttpRef;

	const {snHttpFactory} = await import('sn-http-request');

	const snHttpInstance = snHttpFactory({
		xsrfToken: get(window, 'g_ck') || 'default'
	});
	snHttpRef = snHttpInstance;

	return snHttpInstance;
};

const UXF_TAB_SELECTED = 'UXF_TAB_SET#TAB_SELECTED';
const LIST_ROW_CLICKED = 'NOW_RECORD_LIST_CONNECTED#ROW_CLICKED';
const RECORD_SIDEBAR_ROUTE_CHANGED = 'NOW_RECORD_COMMON_SIDEBAR#ROUTE_CHANGED';
const prefetchActions = [
	LIST_ROW_CLICKED,
	RECORD_SIDEBAR_ROUTE_CHANGED,
	UXF_TAB_SELECTED
];

function formFieldsNotAvailable(seismicProperties) {
	let formFieldsNotAvailable = true;
	if (seismicProperties && seismicProperties.nowUxfSppRecordForm) {
		formFieldsNotAvailable = !(
			seismicProperties &&
			seismicProperties.nowUxfSppRecordForm &&
			seismicProperties.nowUxfSppRecordForm.fields
		);
	}

	return formFieldsNotAvailable;
}

function getFormFields(seismicProperties) {
	let table, sysId;

	if (seismicProperties.nowUxfSppRecordForm) {
		table = seismicProperties.nowUxfSppRecordTable;
		sysId = seismicProperties.nowUxfSppRecordSysId;
	}
	return {table, sysId};
}

export async function prefetch(
	sourceActionName,
	sourceActionPayload,
	seismicProperties
) {
	if (prefetchActions.includes(sourceActionName)) {
		const siteName = get(window, 'ux_globals.routeConfiguration.siteName', '');
		const pageProperties = get(
			window,
			['ux_globals', 'experienceConfigs', siteName, 'pageProperties'],
			{}
		);
		if (pageProperties.hasFormPrefetchEnabled) {
			if (sourceActionName == LIST_ROW_CLICKED) {
				const {
					headerConfigId,
					ribbonConfigId,
					actionConfigId,
					viewRuleConfigId,
					highlightedValueConfigId,
					view
				} = pageProperties;
				const {sys_id: sysId, table} = sourceActionPayload;
				const sysProps = getUxGlobal('sysprops', {});
				const query = {
					operationName: 'snFormDataConnected',
					cacheable: false,
					variables: {
						sysId,
						table,
						headerConfigId,
						ribbonConfigId,
						actionConfigId,
						viewRuleConfigId,
						highlightedValueConfigId,
						views: view,
						position: 'related_item',
						forcedViewName: '',
						query: '',
						preferences: [
							`workspace.layout.type.${table}`,
							`workspace.layout.form_ratio.${table}`,
							`workspace.layout.sidebar_ratio.${table}`,
							`workspace.layout.section.${table}`,
							`workspace.layout.reference.modal_size.${table}`,
							`personalize_${table}_${view}`
						]
					},
					extensions: {
						persistedQuery: {
							version: 1,
							sha256Hash: sysProps.form_query_hash
						}
					},
					query: ''
				};

				snHttp().then((snHttpInstance) =>
					snHttpInstance
						.request(GRAPHQL_ENDPOINT, 'POST', {
							data: [query],
							batch: false,
							headers: {
								'X-NOW-REQUESTED-PREFETCH': `snFormDataConnected ${sysId} forcedViewName `
							}
						})
						.catch(() =>
							console.warn(`Error occured while prefetching form query`)
						)
				);
			} else if (
				sourceActionName === RECORD_SIDEBAR_ROUTE_CHANGED &&
				sourceActionPayload &&
				sourceActionPayload.name === 'agentassisttab'
			) {
				try {
					const {agentAssistPrefetchConfigSysId: tableConfigSysId} =
						pageProperties;

					// This logic applies to San Diego
					if (
						sourceActionName === UXF_TAB_SELECTED &&
						formFieldsNotAvailable(seismicProperties)
					) {
						return;
					}

					// In SD upgrade path these won't be filled in
					let {table, sysId} = getFormFields(seismicProperties);

					// For SD Upgrade try and read table and sysId from context
					if (!table) {
						table = seismicProperties.table;
					}
					if (!sysId) {
						sysId = seismicProperties.sysId;
					}

					if (tableConfigSysId && table && sysId) {
						executeSearchQuery(tableConfigSysId, table, sysId);
					}
				} catch (error) {
					console.error(error);
				}
			}
		}
	}
}

function executeSearchQuery(tableConfigSysId, table, sysId) {
	const searchQuery = {
		operationName: 'nowAgentAssist',
		cacheable: false,
		variables: {
			tableConfig: tableConfigSysId,
			formSysID: sysId,
			formTable: table,
			context: '',
			query: '',
			hints: '{"prefetch": null}'
		},
		query: searchQuerySchema
	};

	snHttp().then((snHttpInstance) =>
		snHttpInstance
			.request(GRAPHQL_ENDPOINT, 'POST', {
				data: [searchQuery],
				batch: false,
				headers: {
					'X-NOW-REQUESTED-PREFETCH': `nowAgentAssistSearch ${sysId}`
				}
			})
			.catch(() => console.warn(`Error occured while prefetching form query`))
	);
}

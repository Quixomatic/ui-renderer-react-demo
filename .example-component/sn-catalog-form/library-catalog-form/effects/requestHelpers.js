import _ from 'lodash';

const multiRowWidgetId = 'sc-multi-row-active-row';
const portalHeaders = {
	'x-portal': '81b75d3147032100ba13a5554ee4902b'
};
const multiRowWidgetURL = `/api/now/sp/widget/${multiRowWidgetId}`;
const validateRequestBody = data => {
	const requiredDataParams = [
		'action',
		'source_id',
		'source_table',
		'variable_set_id'
	];
	for (let param of requiredDataParams) {
		if (!_.has(data, param)) {
			return false;
		}
	}
	return true;
};

export function sendMultRowWidgetRequest(sendRequest, options) {
	const { headers, data } = options;
	let isValidReq = validateRequestBody(data);
	if (!isValidReq) {
		throw Error('Invalid request body for multi-row widget');
	}
	return new Promise((resolve, reject) => {
		sendRequest
			.post(multiRowWidgetURL, {
				headers: {
					...headers,
					...portalHeaders
				},
				data,
				batch: false
			})
			.then(({ data: { result } }) => {
				const data = result.data;
				if (!_.has(data, 'active_row')) {
					throw new Error('Error evaluating multi-row active row data');
				}
				resolve(data.active_row);
			})
			.catch(error => {
				const {
					response: { data, status, statusText } = {},
					message = 'Error evaluating multi-row data'
				} = error;
				reject({
					data,
					status,
					statusText,
					message
				});
			});
	});
}

function transformCatalogDataLookupResult(data) {
	const lookups = data.catalog_data_lookup;
	// field -> lookupId
	let normalizedLookups = _.reduce(
		lookups,
		(acc, lookup) => {
			let fields = lookup.fields;
			let definitionId = lookup.data_lookup_sys_id;
			_.reduce(
				fields,
				(acc, field) => {
					if (!_.has(acc, field)) {
						acc[field] = new Set();
					}
					acc[field].add(definitionId);
					return acc;
				},
				acc
			);
			return acc;
		},
		{}
	);
	return normalizedLookups;
}

const getCatalogDataLookupFetchURL = (
	item /** can be catItemId or varSetId */
) => `angular.do?sysparm_type=catalog_data_lookup&item=${item}`;

export function fetchDataLookupsForMultiRow(sendRequest, item) {
	return new Promise((resolve, reject) => {
		sendRequest
			.get(getCatalogDataLookupFetchURL(item))
			.then(result => {
				resolve(transformCatalogDataLookupResult(result.data));
			})
			.catch(error => {
				const {
					response: { data, status, statusText } = {},
					message = 'Error fetching data-lookups for item'
				} = error;
				reject({
					data,
					status,
					statusText,
					message
				});
			});
	});
}

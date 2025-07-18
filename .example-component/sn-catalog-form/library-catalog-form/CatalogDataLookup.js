/**
 * DataLookup processes a list of fields that have DataLookup definitions (table: dl_definition)
 * defined for that table/field combination.  The customer can create a table that acts as a
 * decision matrix, setting values based on current form field values
 */

/**
 * Initialize DataLookup, transforming the list of fields into an object, and binding the
 * on change handler.
 *
 * @param gForm {Object}
 * @param fields {Array}
 */

export function createCatalogDataLookup(gForm, dataLookupFields, sendRequest) {
	if (!gForm) {
		console.log('g_form is not defined'); /* eslint-disable-line */
		return;
	}

	let dataLookupInProgress = false;
	let lastSerializedForm = null;
	let transactionId = 0;

	/**
	 * Process a field that has a DataLookup definition defined.  There are built in safeguards to prevent
	 * DataLookup definitions triggering themselves, and we count the transactions that we have sent
	 * to only process the most recent for that field.
	 *
	 * @param fieldName {String}
	 * @param oldValue {String}
	 * @param newValue {String}
	 * @param isLoading {boolean}
	 */
	function _process(fieldName, oldValue, newValue, isLoading) {
		if (isLoading || !dataLookupFields[fieldName] || dataLookupInProgress) {
			return;
		}

		const serializedForm = gForm.serialize();
		if (!serializedForm || lastSerializedForm === serializedForm) {
			return;
		}

		for (let lookupId of dataLookupFields[fieldName]) {
			transactionId++;
			lastSerializedForm = serializedForm;
			_sendRequest(
				lookupId,
				transactionId,
				serializedForm.reduce((acc, f) => {
					acc[f.variable_id] = f.value;
					return acc;
				}, {})
			);
		}
	}

	/**
	 * Send a request for DataLookup a DataLookup Definition, setting a form value
	 * if all the criteria has been met.
	 *
	 * @param item {Object}
	 * @param tId {int}
	 */
	function _sendRequest(item, tId, fieldValueMap) {
		const id = tId;
		const data = {
			...fieldValueMap,
			sys_target: 'ni',
			data_lookup_sys_id: item,
			sysparm_id: gForm.getUniqueValue()
		};
		const dataString = Object.keys(data)
			.map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
			.join('&');
		return sendRequest
			.post(`angular.do?sysparm_type=run_catalog_data_lookup`, {
				data: dataString,
				batch: false
			})
			.then(
				response => {
					if (!response.data.fields || id !== transactionId) {
						return;
					}
					dataLookupInProgress = true;
					response.data.fields.forEach(element => {
						gForm.setValue(element.name, element.value, element.displayValue);
					});
					dataLookupInProgress = false;
				},
				response => {
					/* eslint-disable-line */ console.error(
						`Error processing DataLookup Definition ${item.name}`,
						response
					);
				}
			);
	}

	return {
		initialize: function() {
			gForm.$private.events.on('change', _process);
		}
	};
}

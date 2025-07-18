import _ from 'lodash';

const changeValues = {};
export function glideRecordFactory({ sendRequest }) {
	return class GlideRecord {
		/*
		 * query: "An encoded query string used to filter the results" fields: "A
		 * comma-separated list of fields to return in the response" limit: "The
		 * maximum number of results returned per page (default: 10,000)"
		 */
		constructor(tableName) {
			this.tableName = tableName;
			this.encodedQuery = '';
			this.conditions = [];
			this.orderByFields = [];
			this.orderByDescFields = [];
			this.limit = 200;
			this._callback = null;
			this.currentRow = -1;
			this.recordSet = [];
			this.initialized = false;

			if (!this.initialized) {
				this.ignoreNames = {};
				// setup an array of names when we are done initializing..
				// we will use this array later to determine what vars the
				// end user has added
				Object.entries(this).forEach(([xname]) => {
					this.ignoreNames[xname] = true;
				});
			} else {
				Object.entries(this).forEach(([xname]) => {
					if (!this.ignoreNames[xname]) {
						delete this[xname];
					}
				});
			}

			this.initialized = true;
		}

		query(callback) {
			if (typeof callback !== 'function') {
				_logWarn('Q:NOCB', 'Query must be called with a callback function');
				return;
			}

			return sendRequest('/api/now/ui/glideRecord/' + this.tableName, 'GET', {
				params: {
					sysparm_display_value: 'all',
					sysparm_table: this.tableName,
					sysparm_query: this.getEncodedQuery(),
					sysparm_limit: this.getLimit()
				},
				body: {}
			}).then(
				this._queryResponse.bind(this, callback),
				this._queryErrorResponse.bind(this, callback)
			);
		}

		_queryResponse(callback, response) {
			if (!response.data.result) return; /* eslint-disable-line */

			this.recordSet = response.data.result || [];
			callback(this);
		}

		_queryErrorResponse(callback, response = {}) {
			const {
				data: { error: { message, detail } = {} } = {},
				status
			} = response;
			_logWarn(
				'Q:FAILED',
				`Query failed: status=${status} message=${message}, detail=${detail}`
			);
			this.recordSet = [];
			callback(this);
		}

		get(/* fieldName, value, callback */) {
			let callback;
			if (arguments.length == 2 && typeof arguments[1] === 'function') {
				this.addQuery('sys_id', arguments[0]);
				callback = arguments[1];
			} else if (arguments.length == 3 && typeof arguments[2] === 'function') {
				this.addQuery(arguments[0], arguments[1]);
				callback = arguments[2];
			} else {
				_logWarn('GET:NOCB', 'Get must be called with a callback function');
				return;
			}

			this.query(this._getResponse.bind(this, callback));
		}

		_getResponse(callback, response) {
			if (!response) return; /* eslint-disable-line */

			this.next();
			callback(this);
		}

		updateRecord(callback) {
			if (typeof callback !== 'function') {
				_logError(
					'Q:NOCB',
					'UpdateRecord must be called with a callback function'
				);
				return;
			}

			const change = changedFields(this);
			return sendRequest(
				'/api/now/ui/glideRecord/' +
					this.tableName +
					'/' +
					this.getValue('sys_id'),
				'PUT',
				{
					headers: {
						'X-WantSessionNotificationMessages': true,
						'X-No-Response-Body': true
					},
					params: {
						sysparm_display_value: true
					},
					body: change
				}
			).then(callback(this));
		}

		deleteRecord(callback) {
			if (typeof callback !== 'function') {
				_logError(
					'Q:NOCB',
					'DeleteRecord must be called with a callback function'
				);
				return;
			}

			return sendRequest(
				'/api/now/ui/glideRecord/' +
					this.tableName +
					'/' +
					this.getValue('sys_id'),
				'DELETE',
				{
					params: {},
					body: {}
				}
			).then(callback(this));
		}

		// eslint-disable-next-line no-unused-vars
		addQuery(field, operator, value) {
			const args = [];
			Array.prototype.push.apply(args, arguments);

			const name = args.shift();
			const oper = args.length === 1 ? '=' : args.shift();
			const fieldValue = args.shift();

			this.conditions.push({ name, oper, fieldValue });
		}

		hasNext() {
			return this.currentRow + 1 < this.recordSet.length;
		}

		next() {
			return this._next();
		}

		_next() {
			if (!this.hasNext()) return false; /* eslint-disable-line */

			this.loadRow(this.currentRow + 1);
			return true;
		}

		loadRow(index) {
			this.currentRow = index;
			const currentRow = this.getCurrentRow();
			_.each(currentRow, (value, key) => {
				if (_.isObject(value)) {
					value = value.value;
				}

				this[key] = value;
			});
		}

		_loadRecordSet(records) {
			this.recordSet = records || [];
		}

		setEncodedQuery(queryString) {
			this.encodedQuery = queryString;
		}

		getEncodedQuery() {
			const qc = [];
			const ec = this.encodedQuery;
			if (ec) {
				qc.push(ec);
			}
			this.conditions.forEach(q => {
				qc.push(q.name + q.oper + q.fieldValue);
			});

			return '^' + qc.join('^');
		}

		orderBy(field) {
			this.addOrderBy(field);
		}

		orderByDesc(field) {
			this.orderByDescFields.push(field);
		}

		setLimit(maxRows) {
			this.limit = maxRows;
		}

		getLimit() {
			return this.limit;
		}

		setValue(fieldName, fieldValue) {
			changeValues[fieldName] = fieldValue;
		}

		getValue(fieldName) {
			const current = this.getCurrentRow();
			return current ? current[fieldName] : '';
		}

		getDisplayValue(fieldName) {
			const current = this.getCurrentRow();
			if (!fieldName) {
				return current ? current['display_value'] : '';
			} else if (current && current[fieldName]) {
				return current[fieldName].display_value;
			}
			return '';
		}

		getCurrentRow() {
			return this.recordSet[this.currentRow];
		}

		getRowCount() {
			return this.recordSet.length;
		}

		getTableName() {
			return this.tableName;
		}

		toString() {
			return 'GlideRecord';
		}

		addOrderBy(field) {
			this.orderByFields.push(field);
		}
	};
}

function changedFields(object) {
	Object.entries(object).forEach(([fieldName]) => {
		if (object.getValue(fieldName) !== object[fieldName]) {
			if (!object.ignoreNames[fieldName]) {
				changeValues[fieldName] = object[fieldName];
			}
		}
	});
	return changeValues;
}

function _logError(code, msg) {
	/* eslint-disable no-console */
	if (console && console.error) {
		console.error('(GlideRecord) [' + code + '] ' + msg);
	}
	/* eslint-enable no-console */
}

function _logWarn(code, msg) {
	/* eslint-disable no-console */
	if (console && console.warn) {
		console.warn('(GlideRecord) [' + code + '] ' + msg);
	}
	/* eslint-enable no-console */
}

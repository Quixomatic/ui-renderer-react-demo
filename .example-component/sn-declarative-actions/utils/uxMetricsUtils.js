import {get} from 'lodash';
import track, {markTypes} from '@devsnc/ux-metrics';

// Mark level goes from 0 to 5, where higher number the more important.
export const DEFAULT_MARK_LEVEL = 4;

// Mark type of the event. Available options: 'all', 'usage', 'performance'
export const DEFAULT_MARK_TYPE = markTypes.usage;

const TYPE = 'Declarative Action';

const EVENT_NAME = {
	FORM: 'Click Form Action',
	FIELD: 'Click Field Action',
	LIST: 'Click List Action',
	RELATED_LIST: 'Click Related List Action',
	UNKNOWN: 'Click Declarative Action'
};

const EVENT_ORIGIN_EVENT_NAME_MAP = {
	'SN-FORM-INTERNAL-UIACTIONBAR': EVENT_NAME.FORM,
	'SN-DECLARATIVE-FIELD-ACTION-RENDERER': EVENT_NAME.FIELD
};

/**
 * Track component's events for UX usage analytics
 * @param {Object} coeffects - Coeffects object containing props such as host, action payload, and action type.
 * @param {Number} [markLevel=4] - Mark level goes from 0 to 5, where higher number the more important.
 * @param {String} [markType=usage] - Mark type of the event. Available options: 'all', 'usage', 'performance'
 */
const trackUxMetrics = (
	coeffects,
	markLevel = DEFAULT_MARK_LEVEL,
	markType = DEFAULT_MARK_TYPE
) => {
	try {
		let eventName, details;

		if (get(coeffects, 'action.payload.model')) {
			const {
				payload: {
					action: {actionDispatch, assignmentId, id, name, label},
					model: {fieldName, referenceTable, table, tableName}
				}
			} = coeffects.action;

			eventName = getEventName(coeffects.action);

			details = {
				dispatchedAction: actionDispatch ? actionDispatch : '',
				fieldName: fieldName ? fieldName : '',
				fieldTable: referenceTable ? referenceTable : '',
				label,
				name,
				sysId: id ? id : assignmentId,
				table: table ? table : tableName,
				type: TYPE
			};
		} else {
			const {
				payload: {
					action: {actionDispatch}
				}
			} = coeffects.action;

			eventName = actionDispatch;

			details = {
				type: TYPE
			};
		}

		track(
			coeffects,
			eventName,
			{
				...details
			},
			{
				level: markLevel,
				type: markType
			}
		);
	} catch (ex) {
		// not logging the exception to avoid confusing the customers with internal issues.
	}
};

const getEventName = action => {
	const {
		payload: {
			model: {listType}
		}
	} = action;

	if (listType) {
		if (listType === 'DEFAULT') {
			return EVENT_NAME.LIST;
		} else {
			return EVENT_NAME.RELATED_LIST;
		}
	} else {
		let eventOriginNode;
		try {
			eventOriginNode = action.meta.event.composedPath()[0].nodeName;
		} catch (ex) {
			console.warn("Unable to retrieve the event's origin");
		}
		return get(EVENT_ORIGIN_EVENT_NAME_MAP, eventOriginNode, EVENT_NAME.UNKNOWN);
	}
};

export default trackUxMetrics;

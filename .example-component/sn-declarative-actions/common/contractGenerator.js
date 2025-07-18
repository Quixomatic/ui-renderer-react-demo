import {forOwn, get, isArray, isEmpty, isObject, startCase} from 'lodash';
import {t} from 'sn-translate';

export const ACTION_CONFIG = 'actionConfig';
export const ACTION_CONFIG_ID = 'actionConfigId';
export const ASSIGNMENT_ID = 'assignmentId';
export const ACTION_DISPATCH = 'actionDispatch';
export const ARRAY = 'array';
export const BOOLEAN = 'boolean';
export const CONTEXT_VARS = 'contextVars';
export const UXF_CLIENT_ACTION = 'uxf_client_action';
export const ERROR_PREFIX = 'DA contractGenerator error: ';
export const ERROR_ACTION_PAYLOAD =
	'actions have not been passed through transformer to evaluate `{{}}` syntax.';
export const ERROR_TYPE_INVALID = 'modelType is invalid or not supported.';
export const EVAM = 'EVAM';
export const BOARD = 'BOARD';
export const EVENT_NAME = 'eventName';
export const EVENT = 'event';
export const FIELD = 'FIELD';
export const FIELD_TYPE = 'fieldType';
export const FORM = 'FORM';
export const ID = 'id';
export const JSON = 'json';
export const LABEL = 'label';
export const LIST = 'LIST';
export const MODEL = 'model';
export const META_DATA = 'typeMetadata';
export const NAME = 'name';
export const NUMBER = 'number';
export const OBJECT = 'object';
export const PAYLOAD = 'payload';
export const PROPERTIES = 'properties';
export const RELATED_LIST = 'RELATED_LIST';
export const SCHEMA = 'schema';
export const STRING = 'string';
export const TYPE = 'type';
export const VALUE = 'value';
export const CATALOG_WIZARD = 'CATALOG_WIZARD';

export const SUPPORTED_MODELS_TYPES = [
	BOARD,
	EVAM,
	FIELD,
	FORM,
	LIST,
	RELATED_LIST,
	CATALOG_WIZARD
];
export const MODELS = {
	[BOARD]: {
		[ID]: '45757de50fa52010ad4437a98b767e33',
		[LABEL]: t('Board Model')
	},
	[EVAM]: {
		[ID]: '035d270073151010c342d5fdbdf6a715',
		[LABEL]: t('EVAM Model')
	},
	[FIELD]: {
		[ID]: '15920e6d534723003eddddeeff7b1244',
		[LABEL]: t('Field Model')
	},
	[FORM]: {
		[ID]: '360935e9534723003eddddeeff7b127d',
		[LABEL]: t('Form Model')
	},
	[LIST]: {
		[ID]: 'c3547169534723003eddddeeff7b126c',
		[LABEL]: t('List Model')
	},
	[RELATED_LIST]: {
		[ID]: 'd91731a9534723003eddddeeff7b121c',
		[LABEL]: t('Related List Model')
	},
	[CATALOG_WIZARD]: {
		[ID]: 'e48b12c02d559110f8778479e97d46f0',
		[LABEL]: t('Catalog Wizard Model')
	}
};

const getTypeFromValue = value => (isArray(value) ? ARRAY : typeof value);

const evaluateRequired = (actions = [], model = {}) =>
	isEmpty(actions) || isEmpty(actions[0]) || isEmpty(model);

const evaluateModelType = model =>
	isEmpty(model.modelType) || SUPPORTED_MODELS_TYPES.indexOf(model.modelType) === -1
		? ERROR_TYPE_INVALID
		: null;

const getNameAndLabel = key => ({[NAME]: key, [LABEL]: startCase(key)});

const getEventStructure = (value, key, isObject = false) => ({
	...getNameAndLabel(key),
	[FIELD_TYPE]: isObject ? JSON : getTypeFromValue(value),
	[META_DATA]: {
		[SCHEMA]: {
			[TYPE]: getTypeFromValue(value),
			...(isObject && {[PROPERTIES]: {}})
		}
	}
});

const getPropMetadata = (value, key) => ({
	...getNameAndLabel(key),
	[VALUE]: value
});

const buildObject = (value, key, isEventProps) => {
	if (isEventProps && isObject(value)) {
		const event = getEventStructure(value, key, true);
		const {
			typeMetadata: {
				schema: {properties}
			}
		} = event;

		forOwn(value, (v, k) => {
			properties[k] = buildObject(v, k, isEventProps);
		});
		return event;
	}
	return isEventProps ? getEventStructure(value, key) : getPropMetadata(value, key);
};

/**
 *
 * @return {array}
 * @example
 *
 *  [
 *    {
 *      "name": "table",
 *      "label": "Table",
 *      "value": "incidnet"
 *    }
 *  ]
 */
export const buildList = (obj, isEventProps = false) => {
	let arr = [];
	if (isEmpty(obj)) return arr;

	forOwn(obj, (value, key) => {
		arr.push(buildObject(value, key, isEventProps));
	});
	return arr;
};

/**
 *
 * @throws {string}
 * @example 'DA contractGenerator error: actions have not
 * been passed through transformer to evaluate `{{}}` syntax.'
 *
 * @return {array}
 * @example
 *
 *  [
 *    {
 *      "id": "789",
 *      "label": "Baz Clicked",
 *      "eventName": "BAZZZZZ_CLICKED",
 *      "properties": [
 *        {
 *          "name": "message",
 *          "label": "Message",
 *          "fieldType": "json",
 *          "typeMetadata": {
 *            "schema": {}
 *          }
 *        }
 *      ]
 *    }
 *  ]
 *
 */
export const buildEventDefinitions = actions => {
	let arr = [];
	for (var action of actions) {
		const {actionType, actionPayload} = action;

		if (actionType !== UXF_CLIENT_ACTION) continue;
		if (getTypeFromValue(actionPayload) === STRING)
			throw new Error(ERROR_PREFIX + ERROR_ACTION_PAYLOAD);

		arr.push({
			[ID]: get(action, ASSIGNMENT_ID, ''),
			[EVENT_NAME]: get(action, ACTION_DISPATCH, ''),
			[LABEL]: get(action, LABEL, ''),
			[PROPERTIES]: buildList(actionPayload, true)
		});
	}
	return arr;
};

/**
 *
 * @param {object} model
 *
 * @return {object}
 * @example
 *
 *  {
 *    "model": {}
 *    "actionConfig": {},
 *    "contextVars": []
 *  }
 *
 */
export const buildApplicability = model => {
	return {
		[MODEL]: MODELS[model.modelType],
		[ACTION_CONFIG]: {[ID]: get(model, ACTION_CONFIG_ID, '')},
		[CONTEXT_VARS]: buildList(model)
	};
};

/**
 *
 * This generator is necessary for use
 * in providing UIB with the available client actions supported
 * by an action container component.
 *
 * Given a list of transformed `actions`, `contractGenerator`
 * will return an object containing a list of dispatched
 * client event defintions.
 *
 * @param {array} actions
 * @param {object} model (i.e. Fields that exist in container component.)
 *
 * @example
 *
 *  {
 *    "actionConfigId": "",
 *    "columns": "",
 *    "modelType": "LIST",
 *    "parentRecordSysId": "",
 *    "parentTable": "",
 *    "relatedListName": "",
 *    "table": "",
 *  }
 *
 *
 * @throws {string}
 * @example 'DA contractGenerator error: modelType has not
 * been defined.'
 *
 *
 * @return {object}
 * @example
 *
 *  {
 *    "daApplicability": {},
 *    "dispatchedEventDefs": []
 *  }
 *
 */
export const contractGenerator = (actions, model) => {
	if (evaluateRequired(actions, model)) return null;

	if (!isEmpty(evaluateModelType(model))) throw new Error(ERROR_PREFIX + ERROR_TYPE_INVALID);

	return {
		daApplicability: buildApplicability(model),
		dispatchedEventDefs: buildEventDefinitions(actions)
	};
};

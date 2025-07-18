import {createGraphQLEffect} from '@servicenow/ui-effect-graphql';
import {difference, find, get, has, isEmpty, isEqual, merge, set} from 'lodash';

const DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS =
	'DECLARATIVE_ACTION_INTERNAL#RUN_DYNAMIC_CONDITIONS';
const DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS_COMPLETED =
	'DECLARATIVE_ACTION#RUN_DYNAMIC_CONDITION_COMPLETED';
const DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS_FAILED =
	'DECLARATIVE_ACTION#RUN_DYNAMIC_CONDITION_FAILED';

/**
 * Method to pass down Dynamically Evaluated Declarative Actions to slotted children
 * using a property name [daRelayPropName] configured
 *
 * @param {string} host Reference to the DOM element the ShadowRoot is attached
 * @param {string} daRelayPropName prop name of the slotted child component
 * @param {Object} actions Updated Dynamically Evaluated Declarative Actions
 */
export const relayDAUpdates = (host, daRelayPropName, actions) => {
	if (daRelayPropName) {
		const items = host.shadowRoot.querySelector('slot')?.assignedNodes() || [];
		// eslint-disable-next-line no-unused-vars
		for (const item of items) {
			item[daRelayPropName] = actions;
		}
	}
};

/**
 * Returns a list of DA sysIds where dynamicEvaluationEnabled is true
 * @param {Array} declarativeActions
 * @returns Array
 */
export const getDynamicEvaluatedDAs = declarativeActions => {
	return declarativeActions
		.reduce((acc, currentValue) => {
			return acc.concat(currentValue.children);
		}, [])
		.map(da => da.action)
		.filter(da => da.dynamicEvaluationEnabled)
		.map(da => da.assignmentId);
};

export const handlePropertyChanged = context => {
	const {
		action: {
			payload: {name, value, previousValue}
		},
		dispatch,
		properties,
		state,
		host,
		updateState
	} = context;

	if (
		(name === 'modelData' || name === 'declarativeActions') &&
		value &&
		!isEqual(value, previousValue)
	) {
		const {
			declarativeActions,
			modelData: {
				parentTable,
				parentRecordSysId,
				recordSysIds = [],
				conditions,
				table,
				daRelayPropName
			}
		} = properties;
		const {dynamicConditionResults = {}} = state;

		let recordSysIdsToReEvaluate = [];
		let effectedRecordSysIds = [];
		let runDynamicCondition = false;

		if (
			!isEmpty(previousValue) &&
			(!isEqual(value.parentTable, previousValue.parentTable) ||
				!isEqual(value.parentRecordSysId, previousValue.parentRecordSysId) ||
				!isEqual(value.table, previousValue.table) ||
				!isEqual(value.recordSysIds, previousValue.recordSysIds))
		) {
			//ignore unwanted props
			return;
		} else if (!isEqual(value.declarativeActions, previousValue.declarativeActions)) {
			// Clear dynamic condition result cache when DA is changed
			updateState({dynamicConditionResults: {}});
		} else if (
			!isEqual(value.listRefresh, previousValue.listRefresh) &&
			!isEqual(value.listRefresh?.timestamp, value.listRefresh?.timestamp)
		) {
			// Clear dynamic condition result cache when list is refreshed
			updateState({dynamicConditionResults: {}});
			return;
		} else if (!isEqual(value.conditions, previousValue.conditions)) {
			runDynamicCondition = true;
		} else if (
			value.cellUpdatedOn &&
			value.editedRecords &&
			!isEqual(value.cellUpdatedOn, previousValue.cellUpdatedOn) &&
			value.editedRecords.length
		) {
			//handle inline edit
			//note if the same record is being updated again we get the same sysIds in editedRecords
			//so we use cellUpdatedOn in combination
			effectedRecordSysIds = value.editedRecords || [];
			recordSysIdsToReEvaluate = effectedRecordSysIds;
			runDynamicCondition = recordSysIdsToReEvaluate.length;
		} else if (!isEqual(value.selectedRecords, previousValue.selectedRecords)) {
			// NoInlineEdit - get all records not in state

			effectedRecordSysIds = value.selectedRecords || [];
			//dynamicConditionResults is Object of objects
			//Object<{[dasysID]:{[recordSysId]:boolean}}>
			//each of the objects [one per DA] will contain the same set of recordSysIds
			//we need only one object from that to get a list of recordSysIds
			//so we use Object.keys to get one object and then find the difference
			recordSysIdsToReEvaluate = Object.keys(dynamicConditionResults).length
				? difference(recordSysIds, Object.keys(find(dynamicConditionResults)))
				: recordSysIds;
			runDynamicCondition = effectedRecordSysIds.length && recordSysIdsToReEvaluate.length;
		}

		// Get All dynamicEvaluation Enabled DA
		const daSysIds = getDynamicEvaluatedDAs(declarativeActions);

		// Evaluate only dynamicEvaluation Enabled DA
		if (daSysIds.length) {
			if (runDynamicCondition) {
				// Re-Evaluate the conditions again for the DA's against the new Records
				dispatch(DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS, {
					daSysIds, // we send all da's that have dynamicEvaluationEnabled for evaluation
					recordSysIds: recordSysIdsToReEvaluate,
					table,
					parentTable,
					parentRecordSysId,
					conditions // use conditions only for "Select All" case
				});
			} else if (isEmpty(dynamicConditionResults) && isEmpty(previousValue)) {
				//handle list table change with dynamicEval DA when No record selected (no gql fired)
				//update the child of mediator with new DA info
				relayDAUpdates(host, daRelayPropName, declarativeActions);
			} else {
				//handle pagination & count updates on list
				if (!effectedRecordSysIds.length)
					effectedRecordSysIds = value.selectedRecords || [];
				// No need for Re-Evaluation, use the cached data in state to calculate DA state
				updateDeclarativeActions(
					daSysIds,
					effectedRecordSysIds,
					dynamicConditionResults,
					[...declarativeActions],
					host,
					daRelayPropName
				);
			}
		} else {
			//handle list table change with no dynamicEval DA
			//update the child of mediator with new DA info
			relayDAUpdates(host, daRelayPropName, declarativeActions);
		}
	}
};

/**
 * Function to add/update the "enable" property
 * for all the Dynamic Evaluation Enabled DAs based on its defined Conditions
 * and update the slotted child with the Updated Declarative Actions if any
 *
 * @param {Array.<string>} daSysIds  DynamicEvaluation Enabled Declarative Action SysIds
 * @param {Array.<string>} selectedRecords Selected Record SysIds to run conditions on
 * @param {Object} dynamicConditionResults Dynamically Evaluated DA Results from server
 * @param {Object} declarativeActions Declarative Actions
 * @param {string} host Reference to the DOM element the ShadowRoot is attached
 * @param {string} daRelayPropName prop name of the slotted child component
 */
const updateDeclarativeActions = (
	daSysIds = [],
	selectedRecords = [],
	dynamicConditionResults,
	declarativeActions,
	host,
	daRelayPropName
) => {
	let isDirty = false;

	//Run for each of the Dynamic Evaluation Enabled DA's
	daSysIds.forEach(daSysId => {
		//check DA - enable or disable
		//DA has to be disabled if no selected records
		//fail fast - get out of the loop as soon as we find first false
		const isDAEnabled = selectedRecords.length
			? selectedRecords.every(recSysId =>
					get(dynamicConditionResults, `${daSysId}.${recSysId}`, false)
			  )
			: false;

		//find the DAs to update
		declarativeActions.forEach(da => {
			da.children.forEach(daToUpdate => {
				if (daToUpdate.id === daSysId) {
					//Update DA
					if (
						daToUpdate.action &&
						(!has(daToUpdate.action, 'enabled') ||
							daToUpdate.action.enabled !== isDAEnabled)
					) {
						isDirty = true;
						set(daToUpdate.action, 'enabled', isDAEnabled);
					}
				}
			});
		});
	});

	if (isDirty) {
		//handle dirty list status change with dynamicEval DA
		//update the child of mediator with new DA info
		relayDAUpdates(host, daRelayPropName, declarativeActions);
	}
};

/**
 * Function to convert the structure of DA Condition results from GQL to
 * the structure used in the UI
 *
 * @param {Array<{daSysId:string,recordResults:Array<recordSysId:string,result:boolean>}>} results
 * @returns {Array<{[dasysID]:{[recordSysId]:boolean}}>}
 *
 * input daResults
 * [
 *     {
 *         "daSysId": "e217890121fe1910f877aaad21d648c7",
 *         "recordResults": [
 *             {
 *                 "recordSysId": "57af7aec73d423002728660c4cf6a71c",
 *                 "result": false
 *             },
 *             ...more
 *         ]
 *     }
 *     ...more
 * ]
 *
 * output mappedResults
 * [
 *     {
 *         "e217890121fe1910f877aaad21d648c7": {
 *             "57af7aec73d423002728660c4cf6a71c": false,
 *             "ed92e8d173d023002728660c4cf6a7bc": false,
 *             ...more
 *         }
 *     },
 *     ...more
 * ]
 */
const mapDynamicConditionResults = results =>
	results.map(conditionResult => {
		const recData = conditionResult.recordResults.map(rec => ({
			[rec.recordSysId]: rec.result
		}));
		//convert Array<{[recordSysId]: boolean}> to Object<{[recordSysId]: boolean}>
		//and assign that to a daSysID
		return {[conditionResult.daSysId]: Object.assign({}, ...recData)};
	});

export const dynamicConditionCompletedEffect = ({
	action,
	dispatch,
	properties: {
		declarativeActions,
		modelData: {selectedRecords, conditions, daRelayPropName}
	},
	updateState,
	state: {dynamicConditionResults},
	host
}) => {
	const newConditionResults = get(
		action,
		'payload.data.GlideListDeclarativeActionUtil_Query.getEvaluatedDynamicConditions',
		[]
	);

	// convert the structure
	let stateConditionResultsArr = mapDynamicConditionResults(newConditionResults);

	// merge new record data with existing record data in state
	const stateConditionResults = merge(
		dynamicConditionResults,
		Object.assign({}, ...stateConditionResultsArr)
	);

	updateState({dynamicConditionResults: stateConditionResults});

	const daSysIds = getDynamicEvaluatedDAs(declarativeActions);

	//if conditions is in place, its a List Select All Case
	//we get all recordSysIds from the result
	const selectAllRecords = Object.assign({}, ...stateConditionResultsArr);
	const selectedRecordsToEffect =
		conditions && !selectedRecords.length
			? Object.keys(selectAllRecords).length
				? Object.keys(find(selectAllRecords))
				: []
			: selectedRecords;

	updateDeclarativeActions(
		daSysIds,
		selectedRecordsToEffect,
		stateConditionResults,
		[...declarativeActions],
		host,
		daRelayPropName
	);
};

const dynamicConditionQuery = `
query snDeclarativeMediator($daSysIds: [String!], $recordSysIds: [String!], $table: String!, $parentTable: String, $parentRecordSysId: String, $conditions: String){
	GlideListDeclarativeActionUtil_Query{
		getEvaluatedDynamicConditions(daSysIds: $daSysIds, recordSysIds: $recordSysIds, table: $table, parentTable: $parentTable, parentRecordSysId: $parentRecordSysId, conditions: $conditions) {
			daSysId,
			recordResults {
				recordSysId,
				result
			}
		}
	}
}
`;

export const runDynamicConditionsEffect = createGraphQLEffect(dynamicConditionQuery, {
	variableList: [
		'daSysIds',
		'recordSysIds',
		'table',
		'parentTable',
		'parentRecordSysId',
		'conditions'
	],
	successActionType: DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS_COMPLETED,
	errorActionType: DECLARATIVE_ACTION_RUN_DYNAMIC_CONDITIONS_FAILED
});

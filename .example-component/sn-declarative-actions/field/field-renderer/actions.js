import {createGraphQLEffect} from '@servicenow/ui-effect-graphql';
import {get} from 'lodash';

import {getActionsByKey} from './utils';

export const DECLARATIVE_ACTION_FETCH_FIELD_GRAPHQL = 'DECLARATIVE_ACTION_FETCH_FIELD#GRAPHQL';
export const DECLARATIVE_ACTION_FETCH_FIELD_SUCCESS = 'DECLARATIVE_ACTION_FETCH_FIELD#SUCCESS';
export const DECLARATIVE_ACTION_FETCH_FIELD_ERROR = 'DECLARATIVE_ACTION_FETCH_FIELD#ERROR';
export const DECLARATIVE_ACTION_FETCH_FIELD_PRESOURCE = 'DECLARATIVE_ACTION_FETCH#PRESOURCE';

const globalActionsDataPath =
	'data.GlideDeclarativeActions_Query.GlideDeclarativeActions_fieldQuery.fieldDeclarativeActions.fieldActions';
const declarativeFieldActionQuery = `query($tableName: String!, $sysId: String!, $workspaceConfigId: String!) {
	GlideDeclarativeActions_Query {
		GlideDeclarativeActions_fieldQuery {
			fieldDeclarativeActions(table: $tableName, view: "", sysId: $sysId, source: "field", workspaceConfigId: $workspaceConfigId) {
				fieldActions {
					field
					actions {
						name
						icon
						label
						dependency
						requiresValue
						order
						actionType
						actionComponent
						actionDispatch
						actionPayload
						actionAttributes
						groupBy
						group
						assignmentId
						confirmationRequired
						confirmationMessage
						tooltip
						clientScript
						scriptedClientCondition
						modelConditions {
							field
							operator
							value
							newQuery
							or
						}
						payloadMap {
							name
							value
						}
					}
				}
			}
		}
	}
}`;

const fetchActionsEffect = createGraphQLEffect(declarativeFieldActionQuery, {
	variableList: ['tableName', 'sysId', 'workspaceConfigId'],
	successActionType: DECLARATIVE_ACTION_FETCH_FIELD_SUCCESS,
	errorActionType: DECLARATIVE_ACTION_FETCH_FIELD_ERROR
});

export default {
	[DECLARATIVE_ACTION_FETCH_FIELD_GRAPHQL]: fetchActionsEffect,

	[DECLARATIVE_ACTION_FETCH_FIELD_SUCCESS]: ({updateProperties, state, action}) => {
		const {payload, meta} = action;
		const {
			properties: {model}
		} = state;
		const requestTableName = get(meta, 'options.variables.tableName');
		const globalResponse = requestTableName === 'global';

		const key = globalResponse ? model.fieldType : model.fieldName;
		const actionsFromDatasource = get(payload, globalActionsDataPath);

		updateProperties({
			actionsFromDatasource: getActionsByKey(actionsFromDatasource, key)
		});
	},

	[DECLARATIVE_ACTION_FETCH_FIELD_ERROR]: ({updateProperties}) => {
		updateProperties({
			actionsFromDatasource: []
		});
	}
};

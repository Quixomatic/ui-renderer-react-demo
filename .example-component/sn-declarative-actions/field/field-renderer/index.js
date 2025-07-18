import {actionTypes, createCustomElement} from '@servicenow/ui-core';
import {isNull, isString} from 'lodash';
import {preWsConfigSysId} from 'sn-uxpage-presource';

import {openFrameBehavior} from './behaviors';
import actionHandlers, {DECLARATIVE_ACTION_FETCH_FIELD_GRAPHQL} from './actions';
import styles from './view.scss';
import view from './view';

const {COMPONENT_BOOTSTRAPPED} = actionTypes;

const createData = (model, wsConfigSysId) => {
	const {tableName = 'global', recordSysId: sysId = '-1'} = model;
	const workspaceConfigId = isString(wsConfigSysId) ? wsConfigSysId : '-1';

	return {
		tableName,
		sysId,
		workspaceConfigId
	};
};

export {default as canRenderFieldAction} from './utils';
export const SNDeclarativeFieldActionRenderer = 'sn-declarative-field-action-renderer';

createCustomElement(SNDeclarativeFieldActionRenderer, {
	view,
	styles,
	properties: {
		model: {
			default: {}
		},
		actions: {
			default: null
		},
		formData: {
			default: {}
		},
		actionsFromDatasource: {
			default: null
		},
		fetchDeclarativeActions: {
			default: false
		}
	},
	behaviors: [openFrameBehavior, preWsConfigSysId],
	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED]: {
			effect: ({dispatch, properties, state}) => {
				const {actions, model, fetchDeclarativeActions} = properties;
				const {wsConfigSysId} = state.behaviors;

				// we can possibly move this type of logic into a behavior
				if (isNull(actions) && fetchDeclarativeActions)
					dispatch(
						DECLARATIVE_ACTION_FETCH_FIELD_GRAPHQL,
						createData(model, wsConfigSysId)
					);
			}
		},
		...actionHandlers
	}
});

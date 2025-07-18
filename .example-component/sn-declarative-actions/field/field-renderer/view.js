import {isEmpty, isNull, map, take} from 'lodash';
import {t} from 'sn-translate';

import canRenderAction from './utils';

import {transformer} from '../../common/transformActions';

import '@devsnc/sn-record-control';

export const Action = ({action, dispatch, model, key}) => {
	const onClick = (e = {}) => {
		const target = e.target?.shadowRoot?.activeElement || e.target;
		const {metaKey, type} = e;
		const meta = target ? {actionEvent: {metaKey, type, target}} : {};
		dispatch('DECLARATIVE_ACTION', {action, model}, meta);
	};

	return (
		<sn-record-control
			{...(key ? {key} : {})}
			role="application" //fix JAWS on IE to work with Enter and Spacebar
			icon={action.icon}
			on-click={onClick}
			tooltip={action.tooltip}
			config-aria={{
				'aria-label': t('{0}: {1}', action.tooltip || action.label, model.displayValue)
			}}
		/>
	);
};

const view = (state, {dispatch}) => {
	const {behaviors, componentId, properties} = state;
	const {model, actions, actionsFromDatasource, formData} = properties;

	const resolvedActions =
		isNull(actions) && !isEmpty(actionsFromDatasource) ? actionsFromDatasource : actions;

	const cappedActions = take(resolvedActions, 3);
	const metricsData = {
		coeffects: {
			host: {
				componentId,
				componentName: 'sn-declarative-field-action-renderer'
			},
			action: {},
			properties
		},
		eventName: 'FIELD-RENDERER#VIEW_RENDER',
		meta: {
			model
		}
	};
	const evaluatedActions = transformer(cappedActions, model, metricsData);
	return map(evaluatedActions, action => {
		if (!canRenderAction({model, action, formData, behaviors})) {
			return null;
		}

		return <Action key={action.name} model={model} action={action} dispatch={dispatch} />;
	});
};

export default view;

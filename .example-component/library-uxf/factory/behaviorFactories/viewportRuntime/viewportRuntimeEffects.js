import {createHttpEffect} from '@servicenow/ui-effect-http';

import {viewportActions} from '../../../factory/constants';

const {
	UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
	UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED
} = viewportActions;

export const evaluateScriptedConditionsEffect = createHttpEffect(
	'/api/now/uxframework/scripted_conditions',
	{
		method: 'POST',
		batch: true,
		successActionType: UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
		errorActionType: UXF_VIEWPORT_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
		dataParam: 'data'
	}
);

export const evaluateRouteScriptedConditions = createHttpEffect(
	'/api/now/uxframework/scripted_route_conditions',
	{
		method: 'POST',
		batch: true,
		successActionType: UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
		errorActionType: UXF_VIEWPORT_ROUTE_SCRIPTED_CONDITIONS_EVALUATION_COMPLETED,
		dataParam: 'data'
	}
);

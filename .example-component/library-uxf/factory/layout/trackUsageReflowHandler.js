import {
	createInteractionId,
	defineMetric,
	mark,
	getMetricTypes
} from '@servicenow/ui-metrics';
import {get} from '@devsnc/snowdash';
import {SYS_PROP_PERF_ENABLED} from '../../utils/markUtil';

const isMetricDefined = (event) => getMetricTypes()[event];
export const EVENT_METRIC = 'Reflow Usage';
export const USAGE_METRIC_LEVEL = 5;
export const METRIC_TYPE = 'usage';

export const initCustomReflowMetric = () => {
	if (!window.nowUiFramework) {
		window.nowUiFramework = {};
	}

	window.nowUiFramework.uxfReflowInteractionId = createInteractionId();
	defineMetric(EVENT_METRIC, USAGE_METRIC_LEVEL);
};

export const getUiReflowInteractionId = () => {
	return get(
		window,
		'nowUiFramework.uxfReflowInteractionId',
		createInteractionId()
	);
};

export const getExperienceConfig = () => {
	const macroponentTitle = get(
		window,
		'ux_globals.snCanvasScreen.screenData.defaultTitle',
		''
	);
	const macroponentSysId = get(
		window,
		'ux_globals.snCanvasScreen.screenData.macroponentSysId'
	);
	return {
		macroponentTitle,
		macroponentSysId
	};
};

export const markReflow = (context, options = {}) => {
	// don't log marks if usage tracking is disabled
	if (!SYS_PROP_PERF_ENABLED) return;

	// make sure custom metric is defined
	if (!isMetricDefined(EVENT_METRIC)) {
		initCustomReflowMetric();
	}

	const screenMacroponent = getExperienceConfig();
	const pathname = get(window, 'location.pathname', '');
	const screenSize = {
		height: get(window, 'innerHeight', 0),
		width: get(window, 'innerWidth', 0)
	};
	const interactionId = getUiReflowInteractionId();
	const markOptions = {
		...options,
		...screenMacroponent,
		pathname,
		screenSize
	};

	mark(context, interactionId, EVENT_METRIC, markOptions, METRIC_TYPE);
};

import {
	actionTypes,
	whenComponentIsIdle,
	whenAllComponentsIdle,
	getAncestorNode,
	getComponentById
} from '@servicenow/ui-core';
import {
	mark,
	getMetricTypes,
	getInteractionId,
	defineMetric
} from '@servicenow/ui-metrics';

import {has} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';
import {uniq} from '@devsnc/snowdash';
import {set} from '@devsnc/snowdash';
import getUxfSysProp from '../../../utils/getUxfSysProp';
import {getUnifiedCacheStats} from '../../utils';

import {whenGetTemplatesIdle} from '../../../templateLoader/getTemplates.js';

const UXF_PERF_MONITORING_ENABLED =
	getUxfSysProp('glide.uxf.lib.performance.monitoring.enabled', 'false') ===
	'true';

const {COMPONENT_DOM_TREE_READY} = actionTypes;
const UXF_DIRECT_LOAD_COMPLETE = 'UXF_DIRECT_LOAD_COMPLETE';
const UXF_USER_NAV_LOAD_COMPLETE = 'UXF_USER_NAV_LOAD_COMPLETE';

/**
 * Checks if screen is in preview mode or not.
 * @returns
 */
const getIsScreenPreviewFromURL = () => {
	const {searchParams} = new URL(decodeURIComponent(window.location.href));
	return (
		searchParams.has('sysparm_live_preview') ||
		searchParams.get('mode') === 'preview'
	);
};

const isScreenPreview = getIsScreenPreviewFromURL();

/**
 * Only mark total UI time if performance monitoring is enabled
 * and screen is not in preview.
 */
const shouldMarkTotalUITime = UXF_PERF_MONITORING_ENABLED && !isScreenPreview;

// Computing the network time for UXF_USER_NAV_LOAD_COMPLETE events is
// done here instead of the aggregation layer in ux-metrics (persistMetrics)
// There can be a lot of PerformanceTimingEvents, it is better to compute closer
// to the time when we actually need corresponding events.
// The browser by default limits the return of 150 PerformanceTimingEvents
const getResourceNetworkTime = (start) => {
	let totalNetworkTime = 0;
	if (window.performance === undefined) {
		return totalNetworkTime;
	}

	// Get a list of "resource" performance entries
	const resources = window.performance.getEntriesByType('resource');
	if (resources === undefined || resources.length <= 0) return totalNetworkTime;

	const nav_related_resources = resources.filter(function (res) {
		const resStartTime = get(res, ['startTime'], 0);
		return resStartTime > start;
	});

	// check if we have results, reduce() on an empty list error's out.
	if (nav_related_resources.length === 0) return totalNetworkTime;

	const earliestStartEntry = nav_related_resources.reduce(function (
		prev,
		curr
	) {
		const prevStart = get(prev, 'responseStart', 0);
		const currStart = get(curr, 'responseStart', 0);
		return prevStart < currStart ? prev : curr;
	});

	const latestFinishEntry = nav_related_resources.reduce(function (prev, curr) {
		const prevEnd = get(prev, 'responseEnd', 0);
		const currEnd = get(curr, 'responseEnd', 0);
		return prevEnd < currEnd ? curr : prev;
	});

	if (latestFinishEntry && earliestStartEntry) {
		const latestFinish = get(latestFinishEntry, 'responseEnd');
		const earliestStart = get(earliestStartEntry, 'responseStart');
		totalNetworkTime = latestFinish - earliestStart;
	}
	return totalNetworkTime;
};

const computeBeforeAfterLoad = (screen, start, end) => {
	const getAppliedTemplateTime = get(
		window,
		['uxf_timing', 'applied_template', 'time'],
		-1
	);
	const getAppliedTemplateSysId = get(window, [
		'uxf_timing',
		'applied_template',
		'macroponentSysId'
	]);
	set(window, ['uxf_timing', 'applied_template'], {});
	if (getAppliedTemplateSysId !== screen.macroponentSysId) return {};
	const beforeLoad = getAppliedTemplateTime - start;
	const afterLoad = end - getAppliedTemplateTime;
	return {beforeLoad, afterLoad};
};

const getDependencyComponents = (shellComponentId, allNodeIds) => {
	const nodeIds = uniq(allNodeIds);
	const components = [];
	for (let nodeId of nodeIds) {
		const component = getComponentById(`${shellComponentId}-${nodeId}`);
		if (component) {
			components.push(component);
		}
	}
	return components;
};

const getScreenData = (screen) => {
	const screenRoute = get(screen, ['screenData', 'route']);
	const screenFields = get(screen, ['screenData', 'fields']);
	const screenParams = get(screen, ['screenData', 'params']);
	const screenParent = get(screen, ['screenData', 'parent']);
	const experiencePath = get(screen, ['screenData', 'context', 'path']);
	const experienceName = get(screen, [
		'screenData',
		'context',
		'experienceName'
	]);
	const experienceId = get(screen, ['experienceId']);
	const macroponentSysId = get(screen, ['screenData', 'macroponentSysId']);
	const screenTitle = get(
		screen,
		['screenData', 'title'],
		get(screen, ['screenData', 'defaultTitle'])
	);

	return {
		screenRoute,
		screenFields,
		screenParams,
		screenParent,
		experienceName,
		experienceId,
		macroponentSysId,
		screenTitle,
		experiencePath
	};
};

const markNavTotalUiTime = (
	timestamp,
	host,
	action,
	screenData,
	totalUiTimeMeasurementTimedOut
) => {
	if (!shouldMarkTotalUITime) return;
	const navStartTime = get(window, ['uxf_timing', 'most_recent_user_nav'], -1);

	if (navStartTime < 0) return;

	const {beforeLoad, afterLoad} = computeBeforeAfterLoad(
		screenData,
		navStartTime,
		timestamp
	);
	const totalUiTime = timestamp - navStartTime;
	const totalNetworkTime = getResourceNetworkTime(navStartTime);

	// TODO: remove window variables. This is done to faciliate WPT testing.
	set(window, ['uxf_timing', 'total_ui_time_user_nav'], totalUiTime);
	set(
		window,
		['uxf_timing', 'total_ui_time_user_nav_network'],
		totalNetworkTime
	);
	set(window, ['uxf_timing', 'user_nav_screen_data'], screenData);
	set(window, ['uxf_timing', 'after_load_user_nav'], afterLoad);
	set(window, ['uxf_timing', 'before_load_user_nav'], beforeLoad);

	const unifiedCacheStats = getUnifiedCacheStats();

	markInteractive(host, action, UXF_USER_NAV_LOAD_COMPLETE, {
		totalUiTimeMeasurementTimedOut,
		totalUiTime,
		totalNetworkTime,
		afterLoad,
		beforeLoad,
		...screenData,
		...unifiedCacheStats,
		url: window.location.href
	});
};

const markDirectLoadTotalUiTime = (
	timestamp,
	host,
	action,
	screenData,
	totalUiTimeMeasurementTimedOut
) => {
	if (!shouldMarkTotalUITime) return;

	const nav_entries = window.performance.getEntriesByType('navigation');

	if (nav_entries.length < 1) return;

	const requestStartTime = nav_entries[0].startTime;
	const {beforeLoad, afterLoad} = computeBeforeAfterLoad(
		screenData,
		requestStartTime,
		timestamp
	);

	// TODO: remove window variables. This is done to faciliate WPT testing.
	const totalUiTime = timestamp - requestStartTime;
	set(window, ['uxf_timing', 'total_ui_time_direct_load'], totalUiTime);
	set(window, ['uxf_timing', 'direct_load_screen_data'], screenData);
	set(window, ['uxf_timing', 'after_load_direct_load'], afterLoad);
	set(window, ['uxf_timing', 'before_load_direct_load'], beforeLoad);

	const unifiedCacheStats = getUnifiedCacheStats();

	markInteractive(host, action, UXF_DIRECT_LOAD_COMPLETE, {
		totalUiTimeMeasurementTimedOut,
		totalUiTime,
		beforeLoad,
		afterLoad,
		...screenData,
		...unifiedCacheStats,
		url: nav_entries[0].name || window.location.href
	});
};

const markInteractive = (host, action, metric, value) => {
	const metricTypes = getMetricTypes();
	if (!metricTypes[metric]) defineMetric(metric, 5);

	const interactiveId = getInteractionId(action.meta);
	mark(host, interactiveId, metric, value, 'all');
};

const OBSERVERS_BY_MACROPONENT_DOM_NODE = new WeakMap();
const IDLE_MACROPONENT_DOM_NODES = new WeakSet();

function markMacroponentIdle(domNode) {
	const observers = OBSERVERS_BY_MACROPONENT_DOM_NODE.get(domNode) ?? [];
	for (const observer of observers) {
		if (typeof observer === 'function') observer();
	}
	OBSERVERS_BY_MACROPONENT_DOM_NODE.set(domNode, []);

	IDLE_MACROPONENT_DOM_NODES.add(domNode);
}

function whenMacroponentIsIdle(domNode) {
	return new Promise((resolve) => {
		if (IDLE_MACROPONENT_DOM_NODES.has(domNode)) {
			resolve();
		} else {
			const observers = OBSERVERS_BY_MACROPONENT_DOM_NODE.get(domNode) ?? [];
			observers.push(resolve);
			OBSERVERS_BY_MACROPONENT_DOM_NODE.set(domNode, observers);
		}
	});
}

const pause = (duration) =>
	new Promise((resolve) => {
		setTimeout(() => resolve(), duration);
	});

async function getAllComponentsIdleTimestamp() {
	let timestamp = performance.now();

	await pause(100);
	const didPause1 = await whenAllComponentsIdle();
	if (didPause1) {
		timestamp = performance.now();
	}

	await pause(50);
	const didPause2 = await whenAllComponentsIdle();
	if (didPause2) {
		timestamp = performance.now();
	}

	await pause(25);
	const didPause3 = await whenAllComponentsIdle();
	if (didPause3) {
		timestamp = performance.now();
	}

	return timestamp;
}

const SCREEN_MACROPONENT_IDLE_TIMESTAMP_MARKED =
	'__DO_NOT_USE__UXF_INTERNAL#SCREEN_MACROPONENT_IDLE_TIMESTAMP_MARKED';

// used by whenScreenMacroponentIdleDuringPageLoad in @devsnc/uxf-runtime-utils
function signalScreenMacroponentIdle() {
	document.dispatchEvent(new Event(SCREEN_MACROPONENT_IDLE_TIMESTAMP_MARKED));
}

/**
 * Component Interactive Behavior
 * This behavior is responsible for gathering the total UI time for a
 * direct load.
 *
 * Total UI time, is the time from when the first byte is received by the
 * browser up until when the screen macroponent is considered idle.
 *
 * To determine when the screen macroponent is idle, we use Seismic's whenComponentIsIdle utility function.
 *
 * Each time a macroponent's DOM_TREE_READY lifecyle method is handled, we check
 * if the macroponent is held within a screen, if this is true and a total UI
 * time has not been recorded, then we know this is the first screen the user is
 * seeing since landing on the page.
 */
export const getComponentInteractiveBehavior = (
	allNodeIds,
	allNodeTagNames
) => {
	const allNodesConnectedPromise = Promise.all(
		allNodeTagNames.map((nodeTagName) =>
			customElements.whenDefined(nodeTagName)
		)
	);
	return {
		name: 'componentInteractionBehavior',
		actionHandlers: {
			async [COMPONENT_DOM_TREE_READY]({
				host,
				action,
				properties: {nowId: shellComponentId}
			}) {
				await allNodesConnectedPromise;

				const dependencyComponents = getDependencyComponents(
					shellComponentId,
					allNodeIds
				);

				const promises = [
					whenComponentIsIdle(host),
					...dependencyComponents.map((domNode) => {
						return domNode?.tagName.startsWith('MACROPONENT-')
							? whenMacroponentIsIdle(domNode)
							: whenComponentIsIdle(domNode);
					})
				];

				await Promise.all(promises);

				markMacroponentIdle(host);

				const ancestor = getAncestorNode(host);
				//We only care about macroponents that represent a screen
				if (
					ancestor?.tagName === 'SN-CANVAS-SCREEN' &&
					host?.assignedSlot?.assignedNodes()[0] === host
				) {
					const screenData = getScreenData(ancestor);

					const {timedOut} = await whenGetTemplatesIdle();
					const totalUiTimestamp = await getAllComponentsIdleTimestamp();

					if (has(window, ['uxf_timing', 'total_ui_time_direct_load'])) {
						//total_ui_time for direct load has already been measured
						markNavTotalUiTime(
							totalUiTimestamp,
							host,
							action,
							screenData,
							timedOut
						);
					} else {
						signalScreenMacroponentIdle();
						markDirectLoadTotalUiTime(
							totalUiTimestamp,
							host,
							action,
							screenData,
							timedOut
						);
					}
				}
			}
		}
	};
};

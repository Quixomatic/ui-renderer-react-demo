import {has} from '@devsnc/snowdash';
import {whenScreenMacroponentIdleDuringPageLoad} from '@devsnc/uxf-runtime-utils';
import {loadTheme, installTheme} from './factory/themeLoader';
import macroponentFactory from './factory';
import {
	createTemplateLoader,
	seedPageFragment,
	signalSeedingComplete,
	loadSeededPageFragment,
	getTemplates
} from './templateLoader/getTemplates.js';
import {
	registerClientScript,
	registerClientScriptInclude,
	registerInlineScript,
	addNodeObservers,
	getLoaderStats,
	onDemandComponent,
	onDemandExternal,
	wasComponentEvaled,
	wasForceEvaledOnIdle
} from './scriptLoader';
import {
	getComponentsBySysIds,
	getComponentsByTagNames
} from './templateLoader/getComponents';
import getAppliedTemplate from './templateLoader/getAppliedTemplate';
import {uxfViewportBehavior} from './behaviors/componentViewportBehavior';
import setAppConfigToRootMacroponent from './utils/setAppConfigToRootMacroponent';
import {daWrappedClickedBehavior} from './behaviors/daWrappedClickedBehavior';

import createMacroponentLoaderEffect from './effects/macroponentLoaderEffect.js';
import createComponentLoaderEffect from './effects/componentLoaderEffect.js';

import {
	createSandboxedEvaluator,
	defaultAllowedGlobals
} from './scriptLoader/evaluator';

import {NowUIDriverFactory} from './utils/atfDriverLoader';

//TODO: This is a stopgap until we can migrate sn-canvas-core to use the viewport runtime for
//rendering screens.
import registerScreenActionTransformer from './factory/behaviorFactories/viewportRuntime/registerScreenActionTransformer';

import {loadOverriddenScreenEventMappings} from './screenContentOverridesApi/screenEventMappings';
import {loadOverriddenMacroponentConfiguration} from './screenContentOverridesApi/screenMacroponentConfiguration';

import {
	initializeShortcuts,
	initializeContextListeners
} from '@servicenow/now-trigger-library';

import {getMacroponentViewAdapter} from './macroponentAdaptersApi/macroponentView';
import {
	toggleModalOverrides,
	openPopoverOverrides,
	openDialogOverrides,
	closeDialogOverrides
} from './overridesApiForWysiwyg/designTimeHandlers';
import {blockEvents} from './eventBlockingApi/eventBlocking';

const TEMPLATE_LOADER_EXPOSE_NAME = 'templateLoader';
const INITIALIZE_SHORTCUTS_MAX_WAIT_MS = 10000;

const {resolveUxValuesForView, GenerateLayout} = macroponentFactory;

const sandboxUtils = {
	createSandboxedEvaluator,
	defaultAllowedGlobals
};

const globalUxfObject = {
	installTheme,
	macroponentFactory,
	uxfViewportBehavior,
	setAppConfigToRootMacroponent,
	NowUIDriverFactory,
	[TEMPLATE_LOADER_EXPOSE_NAME]: {
		getTemplates,
		getComponentsBySysIds,
		getComponentsByTagNames,
		getAppliedTemplate,
		createTemplateLoader,
		seedPageFragment,
		signalSeedingComplete,
		loadSeededPageFragment
	},
	scriptLoader: {
		getLoaderStats,
		onDemandComponent,
		onDemandExternal,
		wasComponentEvaled,
		wasForceEvaledOnIdle,
		registerClientScript,
		registerClientScriptInclude,
		registerInlineScript
	},
	screenContentOverridesApi: {
		loadOverriddenScreenEventMappings,
		loadOverriddenMacroponentConfiguration
	},
	macroponentAdapters: {
		getMacroponentViewAdapter
	},
	designTimeApi: {
		toggleModalOverrides,
		openPopoverOverrides,
		openDialogOverrides,
		closeDialogOverrides
	},
	overrideEventPropagation: {
		blockEvents
	},
	// these redundant exports exist for backwards-compat reasons
	getTemplates,
	getComponentsBySysIds,
	getComponentsByTagNames,
	getAppliedTemplate,
	registerScreenActionTransformer,
	resolveUxValuesForView,
	daWrappedClickedBehavior,
	__DO_NOT_USE_THIS_WILL_BE_REMOVED__createMacroponentLoaderEffect:
		createMacroponentLoaderEffect, // instead, import from @devsnc/uxf-effect-macroponent-loader
	__DO_NOT_USE_THIS_WILL_BE_REMOVED__createComponentLoaderEffect:
		createComponentLoaderEffect, // instead, import from @devsnc/uxf-effect-component-loader
	sandboxUtils
};

if (!has(window, ['uxf'])) window.uxf = globalUxfObject;

addNodeObservers();
loadTheme();

/**
 * Keyboard Shortcut Initialization
 */
initializeContextListeners();
whenScreenMacroponentIdleDuringPageLoad({
	maxWait: INITIALIZE_SHORTCUTS_MAX_WAIT_MS
})
	.then(() => initializeShortcuts())
	.catch(console.error);

/**
 * This default export is mainly used by scripts served by UxPageProcessor
 */

export default globalUxfObject;

/**
 * These named exports are used by any tectonic library/component that imports library-uxf as an npm package.
 */

// Any changes to this and the named exports MUST be kept in sync
window.__TECTONIC__$devsnc_library_uxf = {
	default: globalUxfObject,
	getTemplates,
	GenerateLayout,
	getComponentsBySysIds,
	getComponentsByTagNames,
	getAppliedTemplate,
	registerScreenActionTransformer,
	uxfViewportBehavior,
	setAppConfigToRootMacroponent,
	daWrappedClickedBehavior,
	installTheme,
	resolveUxValuesForView,
	createTemplateLoader,
	__DO_NOT_USE_THIS_WILL_BE_REMOVED__createMacroponentLoaderEffect:
		createMacroponentLoaderEffect,
	__DO_NOT_USE_THIS_WILL_BE_REMOVED__createComponentLoaderEffect:
		createComponentLoaderEffect,
	sandboxUtils,
	NowUIDriverFactory
};

export {
	getTemplates,
	GenerateLayout,
	getComponentsBySysIds,
	getComponentsByTagNames,
	getAppliedTemplate,
	registerScreenActionTransformer,
	uxfViewportBehavior,
	setAppConfigToRootMacroponent,
	daWrappedClickedBehavior,
	installTheme,
	resolveUxValuesForView,
	createTemplateLoader,
	createMacroponentLoaderEffect as __DO_NOT_USE_THIS_WILL_BE_REMOVED__createMacroponentLoaderEffect, // instead, import from @devsnc/uxf-effect-macroponent-loader
	createComponentLoaderEffect as __DO_NOT_USE_THIS_WILL_BE_REMOVED__createComponentLoaderEffect, // instead, import from @devsnc/uxf-effect-component-loader
	sandboxUtils,
	NowUIDriverFactory
};

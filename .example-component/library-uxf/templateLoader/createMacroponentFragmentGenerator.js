import {createMacroponent} from '../factory/createMacroponent';
import createFragmentGenerator from './createFragmentGenerator';
import appendTranslations from './appendTranslations';
import appendSysProps from './appendSysProps';
import appendUserPrefs from './appendUserPrefs';
import appendPresources from './appendPresources';
import {map} from '@devsnc/snowdash';
import {isEmpty} from '@devsnc/snowdash';
import {getMacroponentTagName} from '../utils/macroponent.js';
import {default as console} from '../utils/getLogger.js';
import importESModules, {importNonModuleScript} from './importESModules.js';
import {
	polyfilledPromiseDotAllSettled,
	getUxGlobal,
	getPagePropertiesForApp,
	getPageContextId,
	getPageMacroponentId,
	getJsonLiteral
} from './utils.js';
import snHttp from '../snHttpInstance/index.js';
import {resolveContextBinding} from '../factory/UxValueResolver/getResolvedBindingWithState';
import {
	APP_PROPS_IDENTIFIER,
	SESSION,
	SYS_PROPS_IDENTIFIER
} from '../factory/constants';
import getUxfSysProp from '../utils/getUxfSysProp';
import {isNil} from '@devsnc/snowdash';

import {mapValues} from '@devsnc/snowdash';
import {
	computeHash,
	getCacheKey,
	getDBCacheHandle
} from '../utils/clientCacheUtils';

const userSessionInfo = getUxGlobal('session', '{}');
const nowAppProps = getPagePropertiesForApp()(getPageContextId());
const nowSysProps = getUxGlobal('sysprops', '{}');
const resolvableCategories = new Set([
	SESSION,
	APP_PROPS_IDENTIFIER,
	SYS_PROPS_IDENTIFIER
]);

const PREFETCH_ENABLED =
	getUxfSysProp('glide.uxf.lib.prefetch', 'true') === 'true';

async function loadAssetDependencies(assetsToLoad, awaitAssetLoading = true) {
	const {esmImports = [], clientScriptEsm = null, sysId} = assetsToLoad;
	if (!isNil(clientScriptEsm)) {
		const {moduleSpecifier} = clientScriptEsm;
		try {
			await importNonModuleScript(moduleSpecifier); // must block registerMacroponent until this finishes
		} catch (e) {
			console.warn(
				`Failed to load UX Client Scripts for macroponent with sysId = ${sysId}`
			);
		}
	}

	const promisedESModules = importESModules(esmImports);
	// this is needed because components in the polaris app shell macroponent are timing-sensitive (bad components!)
	if (awaitAssetLoading) {
		await polyfilledPromiseDotAllSettled(promisedESModules);
	}
}

export function loadPageFragmentMetadata(pageFragment) {
	const {translations, presources, sysProps, userPrefs} = pageFragment;
	appendTranslations(translations);
	appendSysProps(sysProps);
	appendUserPrefs(userPrefs);
	appendPresources(presources);
}

const areResolvable = (inputValues) => {
	if (isEmpty(inputValues)) return true;
	return Object.values(inputValues).every(
		(inputValue) =>
			inputValue?.type === 'JSON_LITERAL' ||
			(inputValue?.type === 'CONTEXT_BINDING' &&
				resolvableCategories.has(inputValue?.binding?.category))
	);
};

const getResolvedInputValues = (inputValues) => {
	if (isEmpty(inputValues)) return inputValues;
	const properties = {userSessionInfo, nowAppProps, nowSysProps};
	return mapValues(inputValues, (inputValue) => {
		if (inputValue?.type === 'CONTEXT_BINDING') {
			const {
				binding: {address, category}
			} = inputValue;
			return getJsonLiteral(
				resolveContextBinding(properties, category, address)
			);
		}
		return inputValue;
	});
};

const shouldPrefetch = (macroponentSysId) => {
	if (macroponentSysId === getPageMacroponentId()) return false;

	const evaluatedPageFragmentSysIds = getUxGlobal('appliedPageFragments', [])
		.filter((pf) => !isEmpty(pf.evaluatedDataBrokers))
		.map((pf) => pf.pageFragmentSysId);
	if (evaluatedPageFragmentSysIds.includes(macroponentSysId)) return false;

	return true;
};

export async function prefetchDatabrokers(
	pipelineDefinitions,
	macroponentSysId
) {
	const prefetchDatabrokerPromises = {};
	if (!shouldPrefetch(macroponentSysId)) return prefetchDatabrokerPromises;

	const dbCache = await getDBCacheHandle();
	map(pipelineDefinitions, async (definition, id) => {
		if (
			definition.every(
				(def) =>
					def.readEvaluationMode === 'EAGER' && areResolvable(def.inputValues)
			)
		) {
			const hydratedPipeline = definition.map((db) => {
				const {type, definitionSysId, inputValues} = db;
				return {
					type,
					definitionSysId,
					inputValues: getResolvedInputValues(inputValues)
				};
			});
			const cacheKey = getCacheKey(id, computeHash(hydratedPipeline));
			let prefetchPromise;
			const response = await dbCache.match(cacheKey);
			if (response) {
				try {
					const result = await response.json();
					prefetchPromise = Promise.resolve({data: {result}});
				} catch (error) {
					console.warn(
						'[library-uxf] Failed to parse cached databroker response',
						error
					);
				}
			}
			if (!prefetchPromise) {
				prefetchPromise = snHttp().then((snHttpInstance) =>
					snHttpInstance.request('/api/now/uxf/databroker/exec', 'POST', {
						data: hydratedPipeline,
						batch: true,
						headers: {'X-Requested-With': 'Prefetch Request'}
					})
				);
			}

			prefetchDatabrokerPromises[id] = {
				prefetchPromise,
				id,
				hydratedPipeline
			};
		}
	});

	return prefetchDatabrokerPromises;
}

export default async function createMacroponentFragmentGenerator(
	pageFragment,
	tagNameSuffix,
	awaitAssetLoading,
	withAppConfigAgnosticSubRoutes
) {
	const {
		template,
		macroponentInstanceJson = {},
		sysId,
		subroutes,
		offRowEventMappings,
		esmImports,
		clientScriptEsm,
		consolidatedConfig: serverProducedConsolidatedConfig
	} = pageFragment;

	const {
		dataPipelines: {pipelineDefinitions}
	} = macroponentInstanceJson;
	let prefetchDatabrokerPromises = {};
	if (PREFETCH_ENABLED)
		prefetchDatabrokerPromises =
			(await prefetchDatabrokers(pipelineDefinitions, sysId)) || {};

	const forcedRedefine = !isNil(tagNameSuffix);
	const tagName = getMacroponentTagName(sysId, tagNameSuffix);
	if (!customElements.get(tagName)) {
		loadPageFragmentMetadata(pageFragment);
		await loadAssetDependencies(
			{esmImports, clientScriptEsm, sysId},
			awaitAssetLoading
		);
	} else {
		console.info(`Skipped loading JS assets for ${tagName}`);
	}
	createMacroponent(
		macroponentInstanceJson,
		undefined,
		{subroutes, offRowEventMappings},
		tagNameSuffix,
		withAppConfigAgnosticSubRoutes,
		prefetchDatabrokerPromises,
		serverProducedConsolidatedConfig,
		pageFragment?.inline
	);
	const modifier = forcedRedefine
		? (template) =>
				template.replace(new RegExp(getMacroponentTagName(sysId), 'g'), tagName)
		: undefined;
	return createFragmentGenerator(template, modifier);
}

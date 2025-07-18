import {get} from '@devsnc/snowdash';
import {isFunction} from '@devsnc/snowdash';
import getResolvedBindingWithState from '../UxValueResolver/getResolvedBindingWithState.js';
import {
	propertyTypes,
	DBK_LIFECYCLE_IDENTIFIER,
	DBK_LIFECYCLE_FETCHING_IDENTIFIER,
	DBK_LIFECYCLE_FETCH_SUCCESS_IDENTIFIER,
	META_PROP_NAME_CONTROLLER_MAP,
	META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP,
	INPUTS,
	SYMBOL_EVENT_MAPPING_SOURCE_IS_FROM_SUB_PAGE
} from '../constants.js';
import controllerDependencyOpFnGetterFactory from './controllerDependencyOpFnGetterFactory';
import {getDatabrokerDefinitionWrapper} from './getDataBrokerDefinitionWrapper.js';

import {mapValues} from '@devsnc/snowdash';

const {DATA_OUTPUT_BINDING} = propertyTypes;

function getOperationsForElementId(
	uxfEmitFn,
	elementId,
	dataBrokerDefinitionIdByElementId,
	dataBrokerOperationFunctions,
	meta
) {
	const definitionId = get(dataBrokerDefinitionIdByElementId, [elementId]);
	return mapValues(
		get(dataBrokerOperationFunctions, [definitionId], {}),
		(fn) => fn(uxfEmitFn, elementId, meta)
	);
}

function getCSDBOperationsWrapper(elementsWrapper, csdbNodeId, dbOperations) {
	return new Proxy(elementsWrapper[csdbNodeId], {
		get(csdbElementsWrapper, targetProperty) {
			// elementsWrapperProxy will take care of enforcing selectable props
			const csdbOperationFn = get(dbOperations, [targetProperty]);
			if (isFunction(csdbOperationFn)) return csdbOperationFn;
			// if not a function, forward to the underlying wrapper for handling
			return Reflect.get(csdbElementsWrapper, targetProperty);
		}
	});
}
const getControllerOfParentControllerDependency = (
	dataElementId,
	seismicProperties,
	key
) => {
	const controllerDependencyMap =
		seismicProperties[META_PROP_NAME_CONTROLLER_MAP];
	const parentControllerDepencies =
		seismicProperties[META_PROP_NAME_PARENT_CONTROLLER_DEPENDENCY_MAP];
	if (!controllerDependencyMap || !parentControllerDepencies) return '';

	const originalController = controllerDependencyMap[dataElementId];
	if (!parentControllerDepencies[originalController]) return '';
	return parentControllerDepencies[originalController][key];
};

const getRealDataElementId = (
	dataElementId,
	controllerAliasMap,
	seismicProperties,
	dataBrokerDefinitionIdByElementId
) => {
	if (
		dataBrokerDefinitionIdByElementId &&
		dataBrokerDefinitionIdByElementId[dataElementId]
	)
		return dataElementId;

	const controllerDependencyMap =
		seismicProperties[META_PROP_NAME_CONTROLLER_MAP];

	if (controllerDependencyMap && controllerDependencyMap[dataElementId])
		dataElementId = controllerDependencyMap[dataElementId];

	if (controllerAliasMap && controllerAliasMap[dataElementId])
		return controllerAliasMap[dataElementId].elementId;

	return dataElementId;
};

const isDependencyController = (dataElementId) =>
	dataElementId.indexOf('.') > 0;

function getDataBrokerWrapper(
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies,
	uxfEmitFn,
	dataBrokerDefinitionIdByElementId,
	dataBrokerOperationFunctions,
	getControllerDepOpFn,
	dbOperations,
	controllerAliasMap,
	seismicProperties,
	dataElementId
) {
	return new Proxy(
		{},
		{
			get(_, propName, receiver) {
				if (
					propName === INPUTS ||
					controllerAliasMap[dataElementId]?.alias.indexOf(propName) >= 0
				)
					return receiver;

				if (!isDependencyController(dataElementId)) {
					const dependencyController =
						getControllerOfParentControllerDependency(
							dataElementId,
							seismicProperties,
							propName
						);
					if (dependencyController) {
						const operations = dbOperations
							? getOperationsForElementId(
									uxfEmitFn,
									dependencyController,
									dataBrokerDefinitionIdByElementId,
									dataBrokerOperationFunctions,
									dependencyController
										? {[SYMBOL_EVENT_MAPPING_SOURCE_IS_FROM_SUB_PAGE]: true}
										: {}
							  )
							: null;

						return getDataBrokerWrapper(
							csdbNodeId,
							pdbNodeIds,
							externalControllerDependencies,
							uxfEmitFn,
							dataBrokerDefinitionIdByElementId,
							dataBrokerOperationFunctions,
							getControllerDepOpFn,
							operations,
							controllerAliasMap,
							seismicProperties,
							`${dataElementId}.${String(propName)}`
						);
					}
				}

				// fixme: add validator for dataElementId / propName
				if (dbOperations != null) {
					const csdbOperationFn = get(dbOperations, [propName]);
					if (isFunction(csdbOperationFn)) return csdbOperationFn;
				}

				const dataElementAddresses = dataElementId.split('.');
				if (propName === DBK_LIFECYCLE_IDENTIFIER) {
					return {
						[DBK_LIFECYCLE_FETCHING_IDENTIFIER]: getResolvedBindingWithState(
							csdbNodeId,
							pdbNodeIds,
							externalControllerDependencies,
							controllerAliasMap,
							seismicProperties,
							undefined,
							DATA_OUTPUT_BINDING,
							{
								address: [
									...dataElementAddresses,
									propName,
									DBK_LIFECYCLE_FETCHING_IDENTIFIER
								]
							}
						),
						[DBK_LIFECYCLE_FETCH_SUCCESS_IDENTIFIER]:
							getResolvedBindingWithState(
								csdbNodeId,
								pdbNodeIds,
								externalControllerDependencies,
								controllerAliasMap,
								seismicProperties,
								undefined,
								DATA_OUTPUT_BINDING,
								{
									address: [
										...dataElementAddresses,
										propName,
										DBK_LIFECYCLE_FETCH_SUCCESS_IDENTIFIER
									]
								}
							)
					};
				}

				const resolvedBindingValue = getResolvedBindingWithState(
					csdbNodeId,
					pdbNodeIds,
					externalControllerDependencies,
					controllerAliasMap,
					seismicProperties,
					undefined,
					DATA_OUTPUT_BINDING,
					{address: [...dataElementAddresses, propName]}
				);

				return resolvedBindingValue === undefined && !!getControllerDepOpFn
					? getControllerDepOpFn(propName)
					: resolvedBindingValue;
			}
		}
	);
}

const notFoundProvider = () => undefined;

export default function getDataWrapper(
	withOperations = false,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencyNames,
	externalControllerDependencies,
	controllerAliasMap,
	seismicProperties,
	elementsWrapper,
	uxfEmitFn,
	dataBrokerDefinitionIdByElementId,
	dataBrokerOperationFunctions
) {
	const dataBrokerDefById = getDatabrokerDefinitionWrapper(
		seismicProperties,
		dataBrokerDefinitionIdByElementId
	);

	return new Proxy(
		{},
		{
			get(_, dataElementId) {
				const realDataElementId = getRealDataElementId(
					dataElementId,
					controllerAliasMap,
					seismicProperties,
					dataBrokerDefById
				);

				const operations = withOperations
					? getOperationsForElementId(
							uxfEmitFn,
							realDataElementId,
							dataBrokerDefById,
							dataBrokerOperationFunctions,
							seismicProperties?.[META_PROP_NAME_CONTROLLER_MAP]?.[
								dataElementId
							]
								? {[SYMBOL_EVENT_MAPPING_SOURCE_IS_FROM_SUB_PAGE]: true}
								: {}
					  )
					: null;

				const getControllerDepOpFn = controllerDependencyOpFnGetterFactory(
					dataElementId,
					externalControllerDependencies,
					uxfEmitFn,
					notFoundProvider
				);

				if (withOperations) {
					if (dataElementId === csdbNodeId)
						return getCSDBOperationsWrapper(
							elementsWrapper,
							csdbNodeId,
							operations
						);
				} else {
					if (dataElementId === csdbNodeId)
						return elementsWrapper[dataElementId];
				}

				return getDataBrokerWrapper(
					csdbNodeId,
					pdbNodeIds,
					externalControllerDependencyNames,
					uxfEmitFn,
					dataBrokerDefById,
					dataBrokerOperationFunctions,
					getControllerDepOpFn,
					operations,
					controllerAliasMap,
					seismicProperties,
					dataElementId
				);
			}
		}
	);
}

import {find, filter} from '@devsnc/snowdash';
import {
	actionTypes,
	unstableAddRenderOnPropertySelectorValueChange,
	unstableRemoveRenderOnPropertySelectorValueChange
} from '@servicenow/ui-core';
import parentDataStore from '../../getParentDataStore';
import {META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID} from '../../constants';
import {getNamespacedComponentId} from '../../utils';
import {getSelectableProp} from '../../UxValueResolver/getResolvedBindingWithState';
import {
	META_PROP_NAME_PARENT_PAGE_COMPONENT_ID,
	META_PROP_NAME_CONTROLLER_MAP,
	MACROPONENT_VALUE_UPDATED
} from '../../constants';

const {COMPONENT_CONNECTED, COMPONENT_DISCONNECTED} = actionTypes;

// This function returns array of functions that will be executed on each properties on Seismic's life cycel.
// The reason is that at that time, we'll able to retrieve nodeId that is need to resolve the selectable prop.
const getPlaceholderProperties = (
	selectableProperties = [],
	seismicProperties
) => {
	let getDerivedSelectableNames = [];
	let getSelectableNames = [];
	selectableProperties.forEach(
		({nodeId, propName, derived, definitionSysId}) => {
			if (derived) {
				getDerivedSelectableNames.push(
					(parentComponentId, definedControllers) => {
						if (definedControllers.includes(nodeId))
							return getSelectableProp(
								getNamespacedComponentId(parentComponentId, nodeId),
								propName
							);

						const {dataShell: parentDataShell} = parentDataStore.get(
							seismicProperties[META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID]
						);
						if (!parentDataShell) return '';

						//TODO: This is only resolved for the first match. It's possible that there are multiple data brokers with the same definitionSysId, we'll need to find a better to resolve this.
						const matchedParentDataBroker = filter(
							parentDataShell.dataBrokers,
							(dataBroker) =>
								dataBroker.proxiedComponentTagName ===
								`macroponent-${definitionSysId}`
						).map((dataBroker) => dataBroker.sysId);
						if (matchedParentDataBroker.length === 0) return '';

						const parentDataBrokerElement = find(
							parentDataShell.dataElements,
							(dataElement) =>
								dataElement.definitionSysId === matchedParentDataBroker[0]
						);
						if (!parentDataBrokerElement) return '';
						const newNodeId = parentDataBrokerElement.id;
						return definedControllers.includes(newNodeId)
							? getSelectableProp(
									getNamespacedComponentId(parentComponentId, newNodeId),
									propName
							  )
							: '';
					}
				);
			} else {
				getSelectableNames.push((shellComponentId) => {
					return getSelectableProp(
						getNamespacedComponentId(shellComponentId, nodeId),
						propName
					);
				});
			}
		}
	);

	return {
		getSelectableNames,
		getDerivedSelectableNames
	};
};

const propChangeRenderRequestOnDerivedProps = (
	getDerivedSelectableNames,
	{host, properties}
) => {
	if (!getDerivedSelectableNames || getDerivedSelectableNames.length === 0)
		return;

	const parentComponentId = properties[META_PROP_NAME_PARENT_PAGE_COMPONENT_ID];
	if (!parentComponentId) return;

	const controllerMap = properties[META_PROP_NAME_CONTROLLER_MAP];
	if (!controllerMap) return;

	getDerivedSelectableNames.forEach((getDerivedSelectableName) => {
		const selectablePropName = getDerivedSelectableName(
			parentComponentId,
			Object.values(controllerMap)
		);
		if (!selectablePropName) return;

		unstableAddRenderOnPropertySelectorValueChange(host, selectablePropName);
	});
};

const propChangeRenderRequest = (getSelectableNames, {host, properties}) => {
	if (!getSelectableNames || getSelectableNames.length === 0) return;

	getSelectableNames.forEach((getSelectableName) => {
		const selectablePropName = getSelectableName(properties.nowId);
		if (!selectablePropName) return;

		unstableAddRenderOnPropertySelectorValueChange(host, selectablePropName);
	});
};

const propChangeRenderRequestWithdraw = (
	getSelectableNames,
	getDerivedSelectableNames,
	{host, properties}
) => {
	if (getSelectableNames)
		getSelectableNames.forEach((getSelectableName) => {
			const selectablePropName = getSelectableName(properties.nowId);
			if (!selectablePropName) return;

			unstableRemoveRenderOnPropertySelectorValueChange(
				host,
				selectablePropName
			);
		});

	if (!getDerivedSelectableNames) return;

	const parentComponentId = properties[META_PROP_NAME_PARENT_PAGE_COMPONENT_ID];
	const controllerMap = properties[META_PROP_NAME_CONTROLLER_MAP] || {};

	getDerivedSelectableNames.forEach((getDerivedSelectableName) => {
		const selectablePropName = getDerivedSelectableName(
			parentComponentId,
			Object.values(controllerMap)
		);
		if (!selectablePropName) return;

		unstableRemoveRenderOnPropertySelectorValueChange(host, selectablePropName);
	});
};

export default (
	selectableProperties,
	mcpSysId = '',
	dispatchMcpUpdates = false
) => {
	let placeholderProps = {};
	return {
		name: 'selectablePropertyResolver',
		actionHandlers: {
			[COMPONENT_CONNECTED]: (coeffects) => {
				const {state, dispatch, properties} = coeffects;
				const {nowId} = properties;
				/*
				 * The component lifecycle methods are called multiple times on a page. Using
				 * COMPONENT_CONNECTED to get the state of the component, this code checks
				 * for variables other than the always-included keys. If other key(s) exist,
				 * then the component is including its state variable(s), which can be collected
				 * and re-broadcast to UIB for the WYSIWYG state.
				 *
				 * The theoretical optimal dispatch of the page's state would be
				 * during the creation of the macroponent, but since there's no
				 * access to Seismic's `dispatch` action there, this is making do.
				 */
				if (dispatchMcpUpdates) {
					let resolvedPayload = {};
					if (Object.keys(state).length > 2) {
						const stateCopy = Object.fromEntries(Object.entries(state));
						delete stateCopy['behaviors'];
						delete stateCopy['properties'];
						resolvedPayload = {state: stateCopy};
					}
					const contextObject = Object.fromEntries(
						Object.entries(properties).filter(
							([key]) => !key.startsWith('nowUxf')
						)
					);

					const selectablePropMap = {};
					for (const selectableProperty of selectableProperties) {
						if (!(selectableProperty.nodeId in selectablePropMap)) {
							selectablePropMap[selectableProperty.nodeId] = {};
						}
						selectablePropMap[selectableProperty.nodeId][
							selectableProperty.propName
						] = null;
					}

					const payload = {
						...resolvedPayload,
						macroponentSysId: mcpSysId,
						elements: selectablePropMap,
						context: {
							props: contextObject
						}
					};
					dispatch(MACROPONENT_VALUE_UPDATED, payload);
				}
				if (!placeholderProps[nowId])
					placeholderProps[nowId] = getPlaceholderProperties(
						selectableProperties,
						properties
					);
				propChangeRenderRequest(
					placeholderProps[nowId].getSelectableNames,
					coeffects
				);

				propChangeRenderRequestOnDerivedProps(
					placeholderProps[nowId].getDerivedSelectableNames,
					coeffects
				);
			},
			[COMPONENT_DISCONNECTED]: (coeffects) => {
				const {
					properties: {nowId}
				} = coeffects;
				if (placeholderProps[nowId]) {
					propChangeRenderRequestWithdraw(
						placeholderProps[nowId].getSelectableNames,
						placeholderProps[nowId].getDerivedSelectableNames,
						coeffects
					);
					delete placeholderProps[nowId];
				}
			}
		}
	};
};

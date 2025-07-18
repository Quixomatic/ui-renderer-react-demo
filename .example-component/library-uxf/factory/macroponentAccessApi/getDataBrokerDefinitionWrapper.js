import parentDataStore from '../getParentDataStore';
import {META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID} from '../constants';
export const getDatabrokerDefinitionWrapper = (
	seismicProperties,
	dataBrokerDefinitionIdByElementId
) => {
	return new Proxy(
		{},
		{
			get(_, elementId) {
				if (
					dataBrokerDefinitionIdByElementId &&
					dataBrokerDefinitionIdByElementId[elementId]
				)
					return dataBrokerDefinitionIdByElementId[elementId];

				const parentMacroponentSysId =
					seismicProperties?.[META_PROP_NAME_PARENT_PAGE_MACROPONENT_SYS_ID];
				if (!parentMacroponentSysId) return;

				const {dataShell: parentDataShell} = parentDataStore.get(
					parentMacroponentSysId
				);
				if (!parentDataShell) return;

				return parentDataShell?.dataElements?.[elementId]?.definitionSysId;
			}
		}
	);
};

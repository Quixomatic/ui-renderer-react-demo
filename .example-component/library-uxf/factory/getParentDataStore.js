import {isEmpty} from '@devsnc/snowdash';

const getParentDataStore = () => {
	let parentDataByPage = new Map();
	let dataByPage = new Map();
	return {
		getDerivedData(macroponentSysId) {
			if (!parentDataByPage.has(macroponentSysId))
				return {
					controllerAliasMap: {},
					proxyDataBrokerNodes: [],
					dataShell: {
						dataBrokers: {},
						dataElements: {}
					}
				};

			const parentData = parentDataByPage.get(macroponentSysId);
			parentDataByPage.delete(macroponentSysId);
			return parentData;
		},
		setDerivedData(macroponentSysId, data) {
			if (isEmpty(data)) return;

			if (!data.proxyDataBrokerNodes || !data.dataShell) return;

			parentDataByPage.set(macroponentSysId, {
				...data,
				proxyDataBrokerNodes: [
					...data.proxyDataBrokerNodes.map((brokerNode) => ({
						...brokerNode,
						derived: true
					}))
				]
			});
		},
		get(macroponentSysId) {
			if (!dataByPage.has(macroponentSysId)) return {};

			const data = dataByPage.get(macroponentSysId);
			return data;
		},
		set(macroponentSysId, data) {
			if (isEmpty(data)) return;
			dataByPage.set(macroponentSysId, data);
		},
		unset(macroponentSysId) {
			dataByPage.delete(macroponentSysId);
		}
	};
};

export default getParentDataStore();

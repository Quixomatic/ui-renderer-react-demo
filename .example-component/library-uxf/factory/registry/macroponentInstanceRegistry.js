const MacroponentInstanceRegistry = new WeakMap();
const MultiInstanceProxyMcpRegistry = new WeakMap();

const createInstanceObject = () => ({
	getApi: null,
	csdbDispatchFn: null,
	rootDispatchFn: null,
	dataBrokerDebouncedPipelineRefreshFns: null,
	parentDispatchFn: null
});

export function getMacroponentInstance(host) {
	if (!MacroponentInstanceRegistry.has(host))
		MacroponentInstanceRegistry.set(host, createInstanceObject());
	return MacroponentInstanceRegistry.get(host);
}

export function getProxyMcpInstance(host) {
	if (!MultiInstanceProxyMcpRegistry.has(host))
		MultiInstanceProxyMcpRegistry.set(host, new Map());
	return MultiInstanceProxyMcpRegistry.get(host);
}

export function getProxyInstanceValue(host, keyName, orSetDefaultWith) {
	const pdbMap = getProxyMcpInstance(host);
	if (!pdbMap.has(keyName)) pdbMap.set(keyName, orSetDefaultWith());
	return pdbMap.get(keyName);
}

export function removeMacroponentInstance(host) {
	if (MacroponentInstanceRegistry.has(host)) {
		MacroponentInstanceRegistry.delete(host);
	}
	if (MultiInstanceProxyMcpRegistry.has(host)) {
		MultiInstanceProxyMcpRegistry.delete(host);
	}
}

const allowlist = Object.keys(createInstanceObject());

export function getInstanceValue(host, keyName, orSetDefaultWith) {
	if (!allowlist.includes(keyName)) return;
	const instanceObject = getMacroponentInstance(host);
	if (instanceObject[keyName] === null)
		instanceObject[keyName] = orSetDefaultWith();
	return instanceObject[keyName];
}

export function setInstanceValue(host, key, value) {
	if (!allowlist.includes(key)) return;
	const instanceObject = getMacroponentInstance(host);
	instanceObject[key] = value;
}

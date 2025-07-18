const components = new Map();
const externals = new Map();
const seenTags = new Set();
const tags = new Map();
const forceEvaledAssets = new Set();

function setTag(tag, name) {
	tags.set(tag, name);
}

function getTag(name) {
	return tags.get(name);
}

function hasTag(name) {
	return tags.has(name);
}

function hasSeenTag(name) {
	return seenTags.has(name);
}

function addSeenTag(name) {
	return seenTags.add(name);
}

function getSeenTagSize() {
	return seenTags.size;
}

function getSeenTagKeys() {
	return seenTags.keys();
}

function hasExternal(name) {
	return externals.has(name);
}

function setExternal(name, value) {
	externals.set(name, value);
}

function getExternal(name) {
	return externals.get(name);
}

function getExternalSize() {
	return externals.size;
}

function getExternalKeys() {
	return [...externals.keys()];
}

function getExternalValues() {
	return [...externals.values()];
}

function hasComponent(name) {
	return components.has(name);
}

function setComponent(name, value) {
	components.set(name, value);
}

function getComponent(name) {
	return components.get(name);
}

function getComponentKeys() {
	return [...components.keys()];
}

function getComponentValues() {
	return [...components.values()];
}

function getComponentSize() {
	return components.size;
}

function addIdleForceEvaledAsset(name) {
	forceEvaledAssets.add(name);
}

function hasIdleForceEvaledAsset(name) {
	return forceEvaledAssets.has(name);
}

export {
	setTag,
	getTag,
	hasTag,
	hasSeenTag,
	addSeenTag,
	getSeenTagKeys,
	getSeenTagSize,
	hasExternal,
	setExternal,
	getExternal,
	getExternalKeys,
	getExternalValues,
	getExternalSize,
	hasComponent,
	setComponent,
	getComponent,
	getComponentKeys,
	getComponentValues,
	getComponentSize,
	addIdleForceEvaledAsset,
	hasIdleForceEvaledAsset
};

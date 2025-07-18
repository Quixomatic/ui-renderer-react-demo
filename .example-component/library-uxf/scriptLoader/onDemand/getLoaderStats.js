import {
	getComponentValues,
	getExternalValues,
	hasTag,
	getSeenTagKeys,
	getSeenTagSize,
	getExternalSize,
	getComponentSize
} from './registries';

function getLoadTimes(setValues) {
	return setValues.filter((x) => x !== false);
}

function sum(arr) {
	return arr.reduce((x, y) => x + y, 0);
}

export default function getLoaderStats() {
	const componentValues = getComponentValues();
	const externalValues = getExternalValues();
	const seenTagKeys = getSeenTagKeys();

	const loadedComponents = getLoadTimes(componentValues).length;
	const componentEvalTime = sum(getLoadTimes(componentValues));
	const loadedExternals = getLoadTimes(externalValues).length;
	const externalEvalTime = sum(getLoadTimes(externalValues));

	const missingTags = [...seenTagKeys].filter((x) => !hasTag(x)).length;

	const externalSize = getExternalSize();
	const componentSize = getComponentSize();

	return {
		components: {
			registered: componentSize,
			loaded: loadedComponents,
			evalTime: componentEvalTime
		},
		externals: {
			registered: externalSize,
			loaded: loadedExternals,
			evalTime: externalEvalTime
		},
		total: {
			registered: componentSize + externalSize,
			loaded: loadedComponents + loadedExternals,
			evalTime: componentEvalTime + externalEvalTime
		},
		tags: {
			seen: getSeenTagSize(),
			missing: missingTags
		}
	};
}

import {isNil} from '@devsnc/snowdash';

export const getMacroponentTagName = (id, suffix) => {
	const suffixToAppend = !isNil(suffix) ? `-${suffix}` : '';
	return `macroponent-${id}${suffixToAppend}`;
};

export const getMacroponentNodes = () => {
	let mcpNode = null,
		macroponentNodes = [];
	try {
		const mcpNodesResult = document.evaluate(
			'//*[starts-with(name(), "macroponent-")]',
			document,
			null,
			XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
			null
		);
		mcpNode = mcpNodesResult.iterateNext();
		while (mcpNode) {
			macroponentNodes.push(mcpNode);
			mcpNode = mcpNodesResult.iterateNext();
		}
		return macroponentNodes;
	} catch (e) {
		console.error('Error: Document tree modified during iteration ' + e);
	}
};

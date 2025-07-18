import cuid from 'cuid';
import {identity} from '@devsnc/snowdash';

export default function createFragmentGenerator(
	templateStr,
	modifierFn = identity
) {
	return (properties) => {
		const template = document.createElement('template');
		const rootElementComponentId = cuid();
		const modifiedTemplate = modifierFn(
			templateStr
				.trim()
				.replace(/@@CONTEXT-INJECTOR@@/g, `${rootElementComponentId}`)
		);
		template.innerHTML = modifiedTemplate;

		const fragment = template.content;
		const rootElement = fragment.firstChild;
		rootElement.setAttribute('component-id', rootElementComponentId);
		for (const k in properties) rootElement[k] = properties[k];

		return fragment;
	};
}

import {getComponentsByTagNames} from '@devsnc/library-uxf';

/*
 * Downloads a single component tag
 */
export const loadComponent = async componentTag => {
	if (!componentTag) return;
	return getComponentsByTagNames([componentTag]).then(names => {
		return names;
	});
};

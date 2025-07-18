import {find} from '@devsnc/snowdash';
import {get} from '@devsnc/snowdash';

import {forOwn} from '@devsnc/snowdash';

import {forEach} from '@devsnc/snowdash';

const checkForDBLifecycleBindings = (descendants, dataElementId) => {
	let foundDBLifecycleBinding = false;

	const dbLifecycleBAs = [
		`${dataElementId},lifecycle,fetchInProgress`,
		`${dataElementId},lifecycle,lastFetchSucceeded`
	];

	const findDBLifeCycleBinding = (value, bindingPath) => {
		const ba = get(value, bindingPath, null);
		if (ba) {
			return find(
				dbLifecycleBAs,
				(dbLifecycleBA) => dbLifecycleBA === ba.join(',')
			);
		}
		return false;
	};

	forOwn(descendants, (nodes) => {
		if (foundDBLifecycleBinding) return;
		forEach(nodes, (node) => {
			if (foundDBLifecycleBinding) return;
			if (findDBLifeCycleBinding(node, 'isHidden.binding.address')) {
				foundDBLifecycleBinding = true;
				return;
			}

			const propValues = node.propertyValues || {};
			Object.values(propValues).forEach((value) => {
				if (foundDBLifecycleBinding) return;
				if (findDBLifeCycleBinding(value, 'binding.address')) {
					foundDBLifecycleBinding = true;
					return;
				}
			});
		});
	});

	return foundDBLifecycleBinding;
};

export default (descendants, dataElementId) =>
	checkForDBLifecycleBindings(descendants, dataElementId);

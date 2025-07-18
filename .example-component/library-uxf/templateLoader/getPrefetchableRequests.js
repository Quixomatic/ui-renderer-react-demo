import {getUxGlobal} from './utils';

const appliedPageFragments = getUxGlobal('appliedPageFragments', []);
const emptyArray = [];
export const getPrefetchableRequests = (pageFragmentSysId) => {
	if (!pageFragmentSysId) return emptyArray;
	const appliedPageFragment = appliedPageFragments.find(
		(apf) => apf.pageFragmentSysId === pageFragmentSysId
	);

	if (!appliedPageFragment) return emptyArray;

	return appliedPageFragment.prefetchableRequests || emptyArray;
};

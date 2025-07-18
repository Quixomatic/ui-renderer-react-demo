import { SC_FORM_VALUECHANGE } from '../common/constants';
const MACROPONENT_VALUE_CHANGED = 'MACROPONENT_VALUE_CHANGED';

export const actions = {
	[MACROPONENT_VALUE_CHANGED]: {
		private: true
	}
};

export const actionHandlers = {
	[MACROPONENT_VALUE_CHANGED]: ({ action: { payload }, dispatch }) => {
		dispatch(SC_FORM_VALUECHANGE, {
			...payload
		});
	}
};

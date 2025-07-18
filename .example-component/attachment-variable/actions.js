import { SC_FORM_VALUECHANGE, ON_CHANGE } from '../common/constants';

export const actions = {
	[ON_CHANGE]: {
		private: true
	}
};
export const actionHandlers = {
	[ON_CHANGE]: ({ action: { payload }, dispatch }) => {
		dispatch(SC_FORM_VALUECHANGE, {
			...payload
		});
	}
};

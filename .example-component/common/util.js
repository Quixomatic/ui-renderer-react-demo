import _ from 'lodash';

export const getDispatchForGFormHandling = (
	{ formDispatch = {} } = {},
	dispatch
) => (!_.isEmpty(formDispatch) ? formDispatch : dispatch);

import {
	DECLARATIVE_ACTION_CANCEL_ACTION,
	DECLARATIVE_ACTION_CLOSE_MODAL,
	DECLARATIVE_ACTION_EXECUTE_ACTION
} from '../actions';
import {get} from 'lodash';

export default {
	'NOW_MODAL#FOOTER_ACTION_CLICKED': ({state, dispatch, action}) => {
		const scriptTitle = get(state, 'properties.action.label', '');
		const buttonTitle = get(action, 'payload.action.label', 'NOT_A_MATCH');
		if (scriptTitle === buttonTitle) dispatch(DECLARATIVE_ACTION_EXECUTE_ACTION);
		else dispatch(DECLARATIVE_ACTION_CANCEL_ACTION);

		dispatch(DECLARATIVE_ACTION_CLOSE_MODAL);
	},
	'NOW_MODAL#OPENED_SET': ({dispatch}) => {
		dispatch(DECLARATIVE_ACTION_CANCEL_ACTION);
		dispatch(DECLARATIVE_ACTION_CLOSE_MODAL);
	}
};

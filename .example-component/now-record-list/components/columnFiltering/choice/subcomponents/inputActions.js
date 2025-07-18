import {
	CHOICE_FILTER_CLEAR_INPUT_VALUE,
	COL_FILTER_INPUT_CHOICE_UPDATED,
	COL_FILTER_INPUT_UPDATED
} from '../../constants';

const genericEffectHandler = ({state, action, dispatch}) => {
	const inputValue = action.payload;
	const name = state.properties.name;
	dispatch(COL_FILTER_INPUT_UPDATED, {[name]: inputValue});
};

export default {
	[CHOICE_FILTER_CLEAR_INPUT_VALUE]: {
		effect: genericEffectHandler
	},
	[COL_FILTER_INPUT_CHOICE_UPDATED]: {
		effect: genericEffectHandler
	}
};

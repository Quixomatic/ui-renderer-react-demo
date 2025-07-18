import {
	COL_FILTER_INPUT_SEARCH_UPDATED,
	COL_FILTER_INPUT_UPDATED
} from '../../constants';

const searchEffectHandler = ({state, action, dispatch}) => {
	const inputValue = action.payload;
	const name = state.properties.name;
	dispatch(COL_FILTER_INPUT_UPDATED, {[name]: inputValue});
};

export default {
	[COL_FILTER_INPUT_SEARCH_UPDATED]: {
		effect: searchEffectHandler
	}
};

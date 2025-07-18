import { isFunction } from "lodash";

const handleButtonClick = ({ state: { properties }, action }) => {
	let { onClick } = properties;

	if (isFunction(onClick)) onClick(action);
};

export const actionHandlers = {
	'NOW_BUTTON#CLICKED': { effect: handleButtonClick, stopPropagation: true },
	'NOW_BUTTON_BARE#CLICKED': {
		effect: handleButtonClick,
		stopPropagation: true
	},
	'NOW_BUTTON_ICONIC#CLICKED': {
		effect: handleButtonClick,
		stopPropagation: true
	}
};
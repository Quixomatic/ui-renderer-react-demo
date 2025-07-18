import { getProperty } from '@devsnc/sn-controls-common';
import { TINYMCE_VERSION } from '../constants';

// Sad caching so we don't need to recreate the `toolbar` array on every render.
let tinymceToolbar;
const getTinyMCEToolbar = () => {
	const toolbar =
		getProperty(`glide.ui.html.editor.${TINYMCE_VERSION}.toolbar`, '').trim() ||
		false;

	if (toolbar !== tinymceToolbar) {
		tinymceToolbar = toolbar;
	}

	return tinymceToolbar;
};

const getFirstDayOfTheWeek = () => {
	let firstDayOfWeek = Number.parseInt(
		getProperty('glide.ui.date_picker.first_day_of_week'),
		10
	);
	return !Number.isNaN(firstDayOfWeek) ? firstDayOfWeek : undefined;
};

const controlOrSysProp = (defaultValue, sysProp, controlPropValue) => {
	let value = defaultValue;
	const sysPropValue = getProperty(sysProp);
	if (sysPropValue !== undefined && sysPropValue !== null) value = sysPropValue;
	if (controlPropValue !== undefined && controlPropValue !== null)
		value = controlPropValue;
	return value;
};

export { getTinyMCEToolbar, getFirstDayOfTheWeek, controlOrSysProp };

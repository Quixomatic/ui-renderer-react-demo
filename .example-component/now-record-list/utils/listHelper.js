import isEmpty from 'lodash/isEmpty';
import {t} from 'sn-translate';

import {AW_LIST, AW_MY_LIST, GRID_CELL_LIST} from '../constants';

// TODO: Should be passed down from connected to prevent duplicate code
const _dropdownOptions = {
	[GRID_CELL_LIST]: [
		{
			title: t('Show matching')
		},
		{
			title: t('Filter out')
		}
	]
};

/**
 * Simple getter for retreiving available dropdown items
 *
 * @param name The name of the dropdown we want to get options for
 * 	i.e. 'sys_aw_list' or 'sys_aw_my_list' or 'grid_cell_list'
 * @return [Array] or undefined
 */
export function getOptions(name) {
	if (
		(!isEmpty(name) && name === AW_LIST) ||
		name === AW_MY_LIST ||
		name === GRID_CELL_LIST
	) {
		return _dropdownOptions[name];
	}
	return undefined;
}

export function isTableSupported(name) {
	return (!isEmpty(name) && name === AW_LIST) || name === AW_MY_LIST;
}

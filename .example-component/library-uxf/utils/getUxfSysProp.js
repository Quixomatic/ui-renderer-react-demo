import {get} from '@devsnc/snowdash';

export default function getUxfSysProp(name, defaultValue) {
	return get(window, ['ux_globals', 'libuxf', 'sysprops', name], defaultValue);
}

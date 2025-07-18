import {getUxGlobal} from './utils';

const SYS_PROPS = getUxGlobal('sysprops', {});

export default function appendSysProps(sysprops) {
	for (const k in sysprops) SYS_PROPS[k] = sysprops[k];
}

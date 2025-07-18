import {getUxGlobal} from './utils';

const PRESOURCES = getUxGlobal('presource', {});

export default function appendPresources(presources) {
	for (const k in presources) PRESOURCES[k] = presources[k].responseBody;
}

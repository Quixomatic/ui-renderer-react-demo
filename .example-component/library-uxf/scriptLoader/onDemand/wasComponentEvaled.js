import {getComponent} from './registries';

export default function wasComponentEvaled(name) {
	return getComponent(name) !== false;
}

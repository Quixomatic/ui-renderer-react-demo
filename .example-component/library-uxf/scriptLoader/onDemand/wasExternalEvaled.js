import {getExternal} from './registries';

export default function wasExternalEvaled(name) {
	return getExternal(name) !== false;
}

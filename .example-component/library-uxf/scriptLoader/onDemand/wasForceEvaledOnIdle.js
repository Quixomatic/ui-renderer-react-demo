import {hasIdleForceEvaledAsset} from './registries';

export default function wasForceEvaledOnIdle(name) {
	return hasIdleForceEvaledAsset(name);
}

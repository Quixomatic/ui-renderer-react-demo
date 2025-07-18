export default function forceEval(name) {
	if (typeof window[name] === 'undefined') return; // the component asset hasn't loaded
	return '__FORCE_EVAL__' in window[name];
}

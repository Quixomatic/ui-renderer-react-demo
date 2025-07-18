const _isIE11 =
	!!window &&
	!!window.MSInputMethodContext &&
	!!document &&
	!!document.documentMode;
const _isEdge = window.navigator.userAgent.indexOf('Edge') > -1;

export function isIE11() {
	return _isIE11;
}

export function isEdge() {
	return _isEdge;
}

const CLICK_HANDLERS = {};

export const eventPath = global => evt => {
	const path = (evt.composedPath && evt.composedPath()) || evt.path,
		target = evt.target;

	if (path != null) {
		// Safari doesn't include Window, but it should.
		return path.indexOf(global) < 0 ? path.concat(global) : path;
	}

	if (target === global) [global];

	const getParents = ({parentNode}, memo = []) =>
		!parentNode ? memo : getParents(parentNode, memo.concat(parentNode));

	return [target].concat(getParents(target), global);
};

export const clearClickHandler = key => {
	if (!(key in CLICK_HANDLERS)) return;
	document.removeEventListener('click', CLICK_HANDLERS[key]);
	delete CLICK_HANDLERS[key];
};

export const addClickHandler = ({
	updateProperties,
	dispatch,
	handlerCallback,
	key
}) => {
	clearClickHandler(key);
	const clickHandlerCallbackRef = handlerCallback({updateProperties, dispatch});
	CLICK_HANDLERS[key] = clickHandlerCallbackRef;
	document.addEventListener('click', clickHandlerCallbackRef);
};

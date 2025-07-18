import '@servicenow/now-modal';

const getScrollOffset = function() {
	const supportPageOffset = window.pageXOffset !== undefined;
	const isCSS1Compat = (document.compatMode || '') === 'CSS1Compat';
	return supportPageOffset
		? window.pageYOffset
		: isCSS1Compat
		? document.documentElement.scrollTop
		: document.body.scrollTop;
};

const freezeBody = function(offset = 0) {
	const freezeStyle = {
		overflowY: 'hidden',
		position: 'fixed',
		top: `-${offset}px`,
		left: '0px',
		width: '100%'
	};
	Object.assign(document.body.style, freezeStyle);
};

const unfreezeBody = function(offset = 0) {
	setTimeout(() => {
		document.body.removeAttribute('style');
		window.scrollTo(0, offset);
	}, 10);
};

const handleEscape = e => {
	if (e.key === 'Escape') {
		e.stopPropagation();
	}
};

export default (properties, children) => {
	if (!properties.opened) {
		unfreezeBody(getScrollOffset());
	}

	freezeBody(getScrollOffset());

	return (
		<now-modal {...properties} on-keydown={handleEscape} manage-opened>
			{children}
		</now-modal>
	);
};

import { isAttrTrue } from './utils/field';

export function checkAutofocus(enabled, ref) {
	if (isAttrTrue(enabled) && ref) {
		// PRB1304655, PRB1309694: Workaround for ShadyDOM bug
		//
		// https://github.com/webcomponents/shadydom/issues/46
		//
		// In polyfilled environments, we need to flush the ShadyDOM render queue
		// before attempting to focus. Without it, Firefox ignores the focus()
		// call, and IE decides to not render anything.
		if (window.ShadyDOM) {
			window.ShadyDOM.flush();
		}

		ref.focus();
	}
}

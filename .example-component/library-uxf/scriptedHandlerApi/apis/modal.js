import getElement from '../../utils/dom';

export const DISPATCHED_EVENTS = ['MODAL_SELECTED'];

export default function(uxfDispatch, host) {
	return {
		open: (id, options) => {
			const elementRef = getElement(host, id);
			const {bare = false, preserveState = false} = options || {};
			uxfDispatch(
				'MODAL_SELECTED',
				{
					modalId: id,
					showModal: true,
					bare,
					preserveState,
					displayOptions: options
				},
				{
					elementRef
				}
			);
		},

		close: (id) => {
			const elementRef = getElement(host, id);
			uxfDispatch(
				'MODAL_SELECTED',
				{
					modalId: id,
					showModal: false
				},
				{
					elementRef
				}
			);
		}
	};
}

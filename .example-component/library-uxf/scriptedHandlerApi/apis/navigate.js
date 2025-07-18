export const DISPATCHED_EVENTS = ['NAV_ITEM_SELECTED', 'CONTENT_UPDATED'];

export default function(uxfDispatch) {
	return {
		to: (
			route,
			fields,
			params = {},
			redirect = false,
			passiveNavigation = false,
			targetRoute = null,
			external,
			title
		) => {
			uxfDispatch('NAV_ITEM_SELECTED', {
				route,
				fields,
				params,
				redirect,
				passiveNavigation,
				targetRoute,
				external,
				title
			});
		},
		setRouteParams: (params) => uxfDispatch('CONTENT_UPDATED', params)
	};
}

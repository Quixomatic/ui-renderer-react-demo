import { snHttpFactory } from 'sn-http-request';

export function createMultiRowValueChangeEffect(resultAction) {
	const sendRequest = snHttpFactory({
		xsrfToken: window.g_ck,
		batching: false
	});
	return {
		effect: createEffect(sendRequest),
		args: [resultAction]
	};
}

const questionDisplayValueURL = sys_id =>
	`/api/sn_sc/servicecatalog/variables/${sys_id}/display_value`;

const createEffect = sendRequest =>
	async function effect(resultAction, { dispatch, action: { payload } }) {
		const { sysparm_value, sys_id } = payload;
		try {
			const { data } = await sendRequest.request(
				questionDisplayValueURL(sys_id),
				'POST',
				{
					data: {
						sysparm_value
					}
				}
			);
			dispatch(resultAction, {
				...payload,
				displayValue: data.result || ''
			});
		} catch (error) {
			console.error(error); // eslint-disable-line
			dispatch(resultAction, {
				...payload,
				displayValue: sysparm_value
			});
		}
	};

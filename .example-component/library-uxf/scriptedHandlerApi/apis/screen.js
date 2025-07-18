export const DISPATCHED_EVENTS = ['SCREEN_STATUS_CHANGED'];

export default function(uxfDispatch) {
	return {
		updateStatus: (statusObj) => {
			const {
				title,
				icon,
				message,
				isDirty,
				dirtyModalId,
				hasError,
				hasUpdate,
				tooltipPreview,
				screenKey,
				status,
				skipNextScreenActivation,
				screenParams
			} = statusObj;
			uxfDispatch('SCREEN_STATUS_CHANGED', {
				title,
				icon,
				message,
				isDirty,
				dirtyModalId,
				hasError,
				hasUpdate,
				tooltipPreview,
				screenKey,
				status,
				skipNextScreenActivation,
				screenParams
			});
		}
	};
}

import track, { markTypes } from '@devsnc/ux-metrics';
import { TRACK_RECOMMENDATION_CLICK } from "./constants";

const eventTitle = 'Update Field Value';

export const trackBehavior = {
	actionHandlers: {
		['TRACK']: {
			effect: coeffects => {
				const {
					action: {
						payload: { metaData, additionalOptions={} }
					}
				} = coeffects;
				setTimeout(() => {
					!additionalOptions.parentHandling &&
						track(coeffects, eventTitle, metaData, {
							type: markTypes.usage
						});

					additionalOptions.isRecommendation &&
						track(coeffects, TRACK_RECOMMENDATION_CLICK, metaData, {
							type: markTypes.usage
						});
				}, 0);
			},
			stopPropagation: true
		},
		['TRACK_DYNAMIC_TRANSLATION_EVENTS']: {
			effect: coeffects => {
				const {
					action: {
						payload: { metaData, eventTitle }
					}
				} = coeffects;
				setTimeout(() => {
					track(coeffects, eventTitle, metaData, {
						type: markTypes.usage
					});
				}, 0);
			},
			stopPropagation: true
		}
	}
};

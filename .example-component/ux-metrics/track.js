import {mark, defineMetric, getMetricTypes, getInteractionId} from '@servicenow/ui-metrics';
import {DEFAULT_LEVEL, markTypes} from './constants';
import validateTrackArguments from './validateTrackArguments';

/**
 * Track usage metric from seismic components
 * @function track
 *
 * @example
 * import track from '@devsnc/ux-metrics';
 * actionHandlers: {
 * 		[BUTTON_CLICKED_ACTION](coeffects) {
 *			track(coeffects, 'BUTTON_CLICKED');
 *		}
 * }
 *
 * @example
 * import track, {markTypes} from '@devsnc/ux-metrics';
 * actionHandlers: {
 * 		[BUTTON_CLICKED_ACTION](coeffects) {
 *			track(
 *                  coeffects,
 *                  'BUTTON_CLICKED',
 *                  {
 *                      "key" : "value"
 *                  },
 *                  {
 *                      level: 3,
 *                      type: markTypes.usage
 *                  }
 *              );
 *          }
 *      }
 *
 * @param {Object} coeffects - Data object containing details of host, action object
 * @param {String} eventName - Name of the event to be tracked
 * @param {Object} metadata - (Optional) Additional data to be stored along with event name,
 * should be simple key value pairs
 * @param {Object} config - (Optional) Additional config data which is needed to
 * define the event level and type
 * @param {Number} config.level - (Optional) Verbosity level of the event, higher is more important
 * @param {String} config.type - (Optional) mark type of the event,which is one of
 * marktypes(all, usage, performance)
 */
export default function track(coeffects = {}, eventName, metadata = {}, config = {}) {
	try {
		const {level = DEFAULT_LEVEL, type = markTypes.usage} = config;
		// no validation in prod but we log error messages in dev environment.
		if (!validateTrackArguments(coeffects, eventName, metadata, level, type))
			return;
		if (!getMetricTypes()[eventName])
			defineMetric(eventName, level);
		const {
			host,
			action: {meta}
		} = coeffects;
		const interactionId = getInteractionId(meta) || '';
		mark(host, interactionId, eventName, metadata, type);
	} catch (err) {
		// Handle any error so that caller's execution thread is not impacted. Log error for non-prod environment
		if (process.env.NODE_ENV !== 'production')
			console.error('Error occurred in track function', err.message);
	}
}

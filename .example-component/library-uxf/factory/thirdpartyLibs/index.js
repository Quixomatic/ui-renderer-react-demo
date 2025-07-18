import {getNowDateTimeAPIs} from './dayjs/getNowDateTimeAPIs';

/**
 * getThirdPartyAPIs
 * @returns {{NowDateTime: *}}
 */
export const getThirdPartyAPIs = () => {
	/**
	 *  Return all third party libraries to client scripts
	 */
	return {
		// NowDateTime library
		NowDateTime: getNowDateTimeAPIs()

		// Add more to expose lodash array or collection utility methods
		// get, set, includes etc.
	};
};

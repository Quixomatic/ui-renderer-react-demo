import {noop} from '@devsnc/snowdash';
import getUxfSysProp from './getUxfSysProp';

const LOGGING_ENABLED =
	getUxfSysProp('glide.uxf.lib.enable_puppeteer_metrics', 'false') === 'true';

const api = LOGGING_ENABLED
	? {
			mark: (name) => performance.mark(name),
			measure: (name, start) => performance.measure(name, start)
	  }
	: {
			mark: noop,
			measure: noop
	  };

export default api;

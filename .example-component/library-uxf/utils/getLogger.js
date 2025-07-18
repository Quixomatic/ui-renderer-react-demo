import {get} from '@devsnc/snowdash';
import {noop} from '@devsnc/snowdash';

const TEST_MODE = process.env.NODE_ENV === 'test';

const LOGGING_ENABLED = get(
	window,
	['nowUiFramework', 'loggingEnabled'],
	TEST_MODE
);

const DEV_MODE = !!process.env.DEV_MODE;

export default new Proxy(console, {
	get(target, property, receiver) {
		if (property !== 'info' && LOGGING_ENABLED)
			return Reflect.get(target, property, receiver);

		if (property === 'info' && DEV_MODE)
			return Reflect.get(target, property, receiver);

		return noop;
	}
});

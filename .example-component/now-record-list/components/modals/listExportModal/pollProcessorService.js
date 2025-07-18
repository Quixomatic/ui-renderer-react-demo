import {Logger} from '@devsnc/sn-list-commons';
import {snHttpFactory} from 'sn-http-request';

import {createQueryString} from '../../../utils/httpUtil';

const LOG = Logger().createLog('PollProcessorService');

const snHttp = snHttpFactory({
	xsrfToken: typeof window !== 'undefined' ? window.g_ck : undefined,
	batch: false,
	batching: false,
	httpRequestCompressionThreshold: 1000000
});

const pollProcessorService = (() => {
	const pollProcessor = (jobId, action) => {
		return snHttp.request('/poll_processor.do', 'POST', {
			params: {
				job_id: jobId,
				sys_action: action,
				sysparm_processor: 'poll_processor'
			},
			method: 'POST'
		});
	};

	const pollInit = pollOptions => {
		const query = createQueryString({...pollOptions, sys_action: 'init'});
		LOG.log('List Export::PollInit()');
		return snHttp.request('/poll_processor.do', 'POST', {
			data: query,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
			}
		});
	};

	return {
		poll: pollProcessor,
		init: pollInit
	};
})();

const emailProcessorService = (() => {
	const emailExport = (email, processorUrl, pollOptions) => {
		return snHttp.request(processorUrl, 'POST', {
			params: {...pollOptions, email_address: email, sys_action: 'email'},
			method: 'POST'
		});
	};
	return {emailExport};
})();

export {pollProcessorService, emailProcessorService};

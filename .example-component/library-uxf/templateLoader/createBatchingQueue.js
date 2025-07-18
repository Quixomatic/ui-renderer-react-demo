import {debounce} from '@devsnc/snowdash';
import {PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_ENABLED} from './getClientCacheableContent.js';
import getUxfSysProp from '../utils/getUxfSysProp.js';

const DEFAULT_MAX_WAIT_TIME_MS = PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_ENABLED
	? 50
	: 300;
const DEFAULT_MAX_ITEM_COUNT = PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_ENABLED
	? 20
	: 10;

export default function createBatchingQueue(
	batchConsumerFn,
	maxWaitTimeMs = parseInt(
		getUxfSysProp(
			'glide.uxf.lib.template_loader.batch.max_wait_time_ms',
			DEFAULT_MAX_WAIT_TIME_MS
		)
	),
	maxBatchItemCount = parseInt(
		getUxfSysProp(
			'glide.uxf.lib.template_loader.batch.max_item_count',
			DEFAULT_MAX_ITEM_COUNT
		)
	)
) {
	const IDLE_CALLBACKS = [];

	function signalIdle() {
		for (const callback of IDLE_CALLBACKS) {
			callback();
		}

		IDLE_CALLBACKS.length = 0;
	}

	const QUEUE = [];
	let PENDING_ITEMS_COUNT = 0;

	let IS_CONSUMING_QUEUE = false;

	function consumeQueueInABatch() {
		if (IS_CONSUMING_QUEUE) return;
		else {
			const requestBatch = QUEUE.splice(0, maxBatchItemCount);
			if (requestBatch.length > 0) {
				IS_CONSUMING_QUEUE = true;
				batchConsumerFn(requestBatch)
					.then(() => {
						IS_CONSUMING_QUEUE = false;
					})
					.finally(() => {
						PENDING_ITEMS_COUNT -= requestBatch.length;
						if (PENDING_ITEMS_COUNT === 0) {
							signalIdle();
						}
						flushQueueImmediately();
					});
			}
		}
	}

	const scheduleFlushQueue = debounce(consumeQueueInABatch, maxWaitTimeMs, {
		maxWait: maxWaitTimeMs
	});

	const {flush: flushQueue} = scheduleFlushQueue;

	// :( why this is needed: https://github.com/lodash/lodash/issues/4185#issuecomment-462388355
	function flushQueueImmediately() {
		scheduleFlushQueue();
		flushQueue();
	}

	function enqueue(...item) {
		return new Promise((resolve, reject) => {
			PENDING_ITEMS_COUNT++;
			QUEUE.push([resolve, reject, ...item]);
			if (QUEUE.length >= maxBatchItemCount) flushQueue();
			else scheduleFlushQueue();
		});
	}

	return {
		enqueue,
		whenIdle({maxWait = 5000} = {}) {
			if (PENDING_ITEMS_COUNT === 0) return Promise.resolve({timedOut: false});

			return new Promise((resolve) => {
				let timedOut = false;
				const timeoutId = setTimeout(() => {
					timedOut = true;
					resolve({timedOut});
				}, maxWait);

				IDLE_CALLBACKS.push(() => {
					if (timedOut) {
						return;
					}
					clearTimeout(timeoutId);
					resolve({timedOut});
				});
			});
		}
	};
}

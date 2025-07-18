import {partial} from '@devsnc/snowdash';
import getUxfEmitFn from './getUxfEmitFn';
import setState from './setState';
import getHelpers, {
	dispatchedEvents as helperDispatchedEvents
} from '../../../scriptedHandlerApi';
import {getRootDispatchFn} from '../../registry/index.js';
import {UXF_INTERNAL_EVENT_META} from '../../constants';
import getViewportApi from '../viewportRuntime/getViewportApi';

export default function getApiFactory(
	dispatchedEventNames,
	handledEventNames,
	rootHandledEventNames,
	host,
	instance,
	getMacroponentAccessApi,
	dispatch,
	updateState,
	dispatchMcpUpdates = false
) {
	const rootDispatchFn = getRootDispatchFn(host, dispatch);
	const emitWithMeta = getUxfEmitFn(
		dispatch,
		rootDispatchFn,
		rootHandledEventNames,
		[],
		[...dispatchedEventNames, ...handledEventNames, ...helperDispatchedEvents]
	);
	const eventHandlerApiAddendum = {
		setState: partial(
			setState,
			instance,
			dispatch,
			updateState,
			null, // unneeded here since this isn't dispatching to UIB WYSIWYG stage
			dispatchMcpUpdates
		)
	};

	return (
		seismicProperties,
		seismicState,
		{[UXF_INTERNAL_EVENT_META]: uxfMeta = {}} = {}
	) => {
		const emit = partial(emitWithMeta, {uxfMeta});
		const helpers = getHelpers(host, emit, dispatch);
		const macroponentAccessApi = getMacroponentAccessApi(
			seismicProperties,
			seismicState,
			emitWithMeta
		);
		const viewports = getViewportApi(seismicState);

		return {
			helpers,
			api: {
				emit,
				viewports,
				...eventHandlerApiAddendum,
				...macroponentAccessApi
			}
		};
	};
}

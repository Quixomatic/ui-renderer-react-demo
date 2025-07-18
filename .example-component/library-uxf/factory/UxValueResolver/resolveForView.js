import resolveWith from './resolveWith.js';
import {propertyTypes} from '../constants.js';
import performanceLogger from '../../utils/puppeteerMetricLogger';

export default (
	resolversForView,
	seismicProperties,
	seismicState,
	uxValue,
	repeaterItem
) => {
	performanceLogger.mark('resolve_ux_value');
	const resolvedUxValue = resolveWith(
		{
			...resolversForView,
			binding: (...args) =>
				resolversForView.binding(seismicProperties, seismicState, ...args),
			[propertyTypes.RUNTIME_INLINE_SCRIPT]: (...args) =>
				resolversForView[propertyTypes.RUNTIME_INLINE_SCRIPT](
					seismicProperties,
					seismicState,
					...args
				)
		},
		uxValue,
		repeaterItem
	);
	performanceLogger.measure('UX Value Resolution', 'resolve_ux_value');
	return resolvedUxValue;
};

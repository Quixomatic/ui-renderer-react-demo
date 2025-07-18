import {partial} from '@devsnc/snowdash';
import resolveWith from './resolveWith';
import getResolvedBindingWithSelectableProps from './getResolvedBindingWithSelectableProps';
import basicResolvers from './basicResolvers';

export default (shellComponentId, csdbComponentId, _, __, uxValue) => {
	return resolveWith(
		{
			...basicResolvers,
			binding: partial(
				getResolvedBindingWithSelectableProps,
				shellComponentId,
				csdbComponentId
			)
		},
		uxValue
	);
};

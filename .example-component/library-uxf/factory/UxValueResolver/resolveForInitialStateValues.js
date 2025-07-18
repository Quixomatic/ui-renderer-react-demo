import {partial} from '@devsnc/snowdash';
import resolveWith from './resolveWith';
import getResolvedBindingWithState from './getResolvedBindingWithState';

import {propertyTypes} from '../constants';
import basicResolvers from './basicResolvers';

const {CONTEXT_BINDING} = propertyTypes;

export default (seismicProperties, uxValue) => {
	return resolveWith(
		{
			...basicResolvers,
			[CONTEXT_BINDING]: partial(
				getResolvedBindingWithState,
				undefined,
				[],
				[],
				{},
				seismicProperties,
				undefined
			)
		},
		uxValue
	);
};

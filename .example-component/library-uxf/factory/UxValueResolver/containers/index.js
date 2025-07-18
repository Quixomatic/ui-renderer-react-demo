import mapValues from 'lodash/mapValues';
import {propertyTypes} from '../../constants';
import resolveWith from '../resolveWith';

const {MAP_CONTAINER, LIST_CONTAINER} = propertyTypes;

export default (resolvers, type, container, repeaterItem) => {
	const resolve = (resolvers, repeaterItem) => (uxValue) =>
		resolveWith(resolvers, uxValue, repeaterItem);
	switch (type) {
		case MAP_CONTAINER:
			return mapValues(container, resolve(resolvers, repeaterItem));
		case LIST_CONTAINER:
			return container.map(resolve(resolvers, repeaterItem));
		default:
			return null;
	}
};

import {
	getDbLifecycleFetchingProp,
	getDbLifecycleFetchSuccessProp,
	getDbOutputProp
} from '../../../utils';
import {DB_TYPE_CLIENT_STATE} from './constants';

const getPropertiesForDataBroker = (dataBroker) => {
	const {id = ''} = dataBroker;

	const outputProps = {
		[getDbOutputProp(id)]: {
			selectable: true
		},
		[getDbLifecycleFetchingProp(id)]: {
			selectable: true
		},
		[getDbLifecycleFetchSuccessProp(id)]: {
			selectable: true
		}
	};

	return {
		...outputProps
	};
};

export default (dataBrokers = []) => {
	return dataBrokers
		.filter(({type}) => type !== DB_TYPE_CLIENT_STATE)
		.reduce((acc, dataBroker) => {
			return {
				...acc,
				...getPropertiesForDataBroker(dataBroker)
			};
		}, {});
};

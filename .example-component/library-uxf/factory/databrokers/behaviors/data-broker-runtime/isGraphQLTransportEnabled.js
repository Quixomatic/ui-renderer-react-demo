import getUxfSysProp from '../../../../utils/getUxfSysProp';
import {DB_GQL_TRANSPORT_PROPERTY} from './constants';

export default () => {
	return getUxfSysProp(DB_GQL_TRANSPORT_PROPERTY, 'false') === 'true';
};

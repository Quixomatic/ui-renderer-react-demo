import {get} from '@devsnc/snowdash';

import {propertyTypes} from '../constants';

const {EVENT_PAYLOAD_BINDING} = propertyTypes;

export default (payload, type, {address}) => {
	switch (type) {
		case EVENT_PAYLOAD_BINDING:
			return get(payload, address);
	}
};

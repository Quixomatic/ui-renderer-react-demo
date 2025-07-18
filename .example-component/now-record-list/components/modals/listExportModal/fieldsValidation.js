import {isInputEmpty} from '../../list/listUtils';

export const hasInvalid = fields => {
	return (
		fields.filter(f => {
			let isVisible = typeof f.show === 'function' ? f.show(fields) : true;
			let isEmpty = false;
			if (['email', 'text'].indexOf(f.type) > -1) {
				isEmpty = isInputEmpty(f.value);
			}
			return isVisible && f.mandatory && (isEmpty || f.invalid);
		}).length > 0
	);
};

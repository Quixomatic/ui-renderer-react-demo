import makeClass from 'classnames';
import { createOnValueChangeHandler } from '../common';
import { controlElementFactory as glideControlElementFactory } from '@devsnc/sn-glide-form-controls';
import { isAttrTrue } from '../utils';
import { SC_FORM_VALUECHANGE } from '../common/constants';
import '@servicenow/now-legacy-icon';

export const view = ({ properties }, dispatch) => {
	let { field, formData, instanceId } = properties;
	let isRequired = isAttrTrue(field.mandatory);
	let wrapperClassName = makeClass('form-controls sc-checkbox-flex', {
		'has-error': isAttrTrue(field.isInvalid)
	});
	let {
		// eslint-disable-next-line no-unused-vars
		Control,
		props,
		children,
		render
	} = glideControlElementFactory.getFormControl(
		instanceId,
		field.type,
		{ ...field, mandatory: !field.hideMandatory && isRequired },
		createOnValueChangeHandler(SC_FORM_VALUECHANGE, dispatch),
		null,
		formData
	);
	if (render) {
		return (
			<div className={wrapperClassName}>
				<Control {...props}>{children}</Control>
			</div>
		);
	}
};

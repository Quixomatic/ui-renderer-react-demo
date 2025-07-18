import { createOnValueChangeHandler } from '../common';
import { controlElementFactory as glideControlElementFactory } from '@devsnc/core/sn-glide-form-controls';
import { ON_CHANGE } from '../common/constants';

export const view = ({ properties }, dispatch) => {
	let { field, formData, instanceId } = properties;
	field.referringTable = formData.targetTable || formData.tableName;
	field.referringRecordId = formData.targetRecordId || formData.sysId;
	let {
		// eslint-disable-next-line no-unused-vars
		Control,
		props,
		children,
		render
	} = glideControlElementFactory.getFormControl(
		instanceId,
		field.type,
		field,
		createOnValueChangeHandler(ON_CHANGE, dispatch),
		null,
		formData
	);

	if (render) {
		props.maxAttachmentSize =
			field.maxAttachmentSize != ''
				? field.maxAttachmentSize
				: props.maxAttachmentSize;
		props.extensions =
			field.extensions != '' ? field.extensions : props.extensions;
		return (
			<div className="form-control">
				<Control {...props}>{children}</Control>
			</div>
		);
	}
};

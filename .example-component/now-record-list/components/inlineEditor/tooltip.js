import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import * as FieldType from '../../fieldType';

import styles from './styles.scss';

export const INLINE_EDIT_TOOLTIP_COMPONENT_NAME =
	'sn-record-list-inline-editor-tooltip';

export const isFieldTypeSupported = fieldType => {
	if (
		[
			FieldType.CHOICE,
			FieldType.DATE,
			FieldType.DATE_TIME,
			FieldType.REFERENCE,
			FieldType.STRING,
			FieldType.INTEGER,
			FieldType.BOOLEAN,
			FieldType.TABLE_NAME,
			FieldType.DURATION,
			FieldType.URL,
			FieldType.DECIMAL,
			FieldType.FLOAT,
			FieldType.EMAIL,
			FieldType.PHONE,
			FieldType.PHONE_NUMBER_E164
		].indexOf(fieldType) > -1
	) {
		return true;
	}
	return false;
};

export const view = state => {
	return (
		<div className="inline-tooltip" aria-live="assertive">
			{state.properties.message}
		</div>
	);
};

createCustomElement(INLINE_EDIT_TOOLTIP_COMPONENT_NAME, {
	renderer: {
		type: snabbdom,
		view
	},
	properties: {
		message: {default: ''}
	},
	styles
});

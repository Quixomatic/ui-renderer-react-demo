import { isAttrTrue, renderFormFieldHelper } from '../utils';
import { get } from 'lodash';

export const view = ({ properties }) => {
	let {
		field: { label, visible }
	} = properties;
	let field = properties.field;
	if (isAttrTrue(visible)) {
		return (
			<div className="label-text">
				<div style={{ display: 'inline-block' }}>
					<now-heading level="3" label={label} variant="header-tertiary" />
				</div>
				{renderFormFieldHelper(get(field, 'dictionary.fieldHint', ''), false)}
			</div>
		);
	}
};

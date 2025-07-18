import { isEmpty } from 'lodash';
import '@servicenow/now-heading';
import { getFieldAnnotation, renderFormFieldHelper } from '../utils';

export default (title, field) => {
	if (isEmpty(title)) {
		return;
	}

	return (
		<div className="sc-section-header">
			<div style={{ display: 'inline-block' }}>
				<now-heading
					label={title}
					has-no-margin
					level="3"
					variant="header-tertiary"
				/>
			</div>
			{renderFormFieldHelper(getFieldAnnotation(field), field.invalid)}
		</div>
	);
};

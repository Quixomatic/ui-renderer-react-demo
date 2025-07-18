import _ from 'lodash';
import { default as createColumnWithContext } from '../sn-catalog-form/columnFactory';
import '../variable-section';
import { getFieldAnnotation, isAttrTrue } from '../utils';
import header from '../variable-section/header';
import { VariableType } from '../common';

export default state => {
	let {
		properties: {
			layout = {},
			parent,
			formData,
			formProps,
			fields = {},
			variablesLayout = {},
			columns
		}
	} = state;
	const { captionDisplay: caption, name } = layout;
	const field = fields[name] || {};
	if (!isAttrTrue(_.get(field, 'visible', true))) {
		return null;
	}
	let leftColumnRenderer = createColumnWithContext(
		fields,
		variablesLayout,
		formData,
		formProps
	);
	let rightColumnRenderer = column => (
		<div className="sc-container-two-col">
			{' '}
			{createColumnWithContext(fields, variablesLayout, formData, formProps)(
				column
			)}
		</div>
	);
	let renderSection = (caption, parent, columns) => {
		return (
			<sn-catalog-form-variable-section caption={caption} parent={parent}>
				{columns.map((column, index) => {
					if (index == 1) {
						return rightColumnRenderer(column);
					}
					return leftColumnRenderer(column);
				})}
			</sn-catalog-form-variable-section>
		);
	};
	if (layout.type === VariableType.CHECKBOX_CONTAINER) {
		// eslint-disable-next-line no-unused-vars
		const { _children, ...fieldProps } = field; // removing children. This has special meaning in react
		return (
			<sn-record-control-wrapper
				hook-insert={vnode => {
					// hack to getaway with the negative margin on checkbox variable
					const observer = new MutationObserver((mutations, observer) => {
							for (let mutation of mutations) {
								for (let addedNode of mutation.addedNodes) {
									const labelEle = addedNode.querySelector('label');
									if (labelEle && labelEle.style) {
										labelEle.style['z-index'] = 1;
										observer.disconnect();
									}
								}
							}
					});
					observer.observe(vnode.elm.shadowRoot, { childList: true });
				}}
				{...fieldProps}
				label={caption}
				required={field.mandatory}
				invalid={fieldProps.isInvalid}
				helperContent={getFieldAnnotation(field)}
			>
				<div className="sc-checkbox-container">
					{renderSection(null, parent, columns)}
				</div>
			</sn-record-control-wrapper>
		);
	}
	return <div>{renderSection(header(caption, field), parent, columns)}</div>;
};

import { controlElementFactory as glideControlElementFactory } from '@devsnc/sn-glide-form-controls';
import { VariableType } from '../common';
import { createOnValueChangeHandler } from '../common';
import '../masked-variable';
import '../checkbox-variable';
import '../label-variable';
import '../rich-text-label';
import '../attachment-variable';
import '../macro-variable';
import '../multiple-select';
import { SC_FORM_VALUECHANGE } from '../common/constants';
import transformVariable from './transformVariable';
import { cloneDeep } from 'lodash';
import { shouldRenderPrintableReadOnlyMode } from './utils';
import '@servicenow/now-radio-buttons';
import { RENDER_STYLE } from '../common/constants';
import '@servicenow/now-input';
import '@servicenow/now-textarea';
import '@servicenow/now-rich-text';
import makeClass from 'classnames';
import _ from 'lodash';

export default ({ properties, componentId }, dispatch) => {
	let { field, formProps = {} } = properties;
	let { variableGap } = formProps;
	if (_.isEmpty(variableGap)) {
		variableGap = 'md';
	}
	if (shouldRenderPrintableReadOnlyMode(formProps, field)) {
		return (
			<div
				className={makeClass({
					'sc-variable-wrapper': field.visible,
					['-' + variableGap]: variableGap && field.visible
				})}
			>
				{getVariableViewForPrintableReadOnlyMode(
					properties,
					componentId,
					dispatch
				)}
			</div>
		);
	}
	return (
		<div
			className={makeClass({
				'sc-variable-wrapper': field.visible,
				['-' + variableGap]: variableGap && field.visible
			})}
		>
			<div className={compactRender(formProps, field) ? 'compact-control' : ''}>
				{getVariableViewForNonReadOnlyMode(properties, componentId, dispatch)}
			</div>
		</div>
	);
};

const compactRender = (formProps, field) => {
	if (formProps.renderStyle === RENDER_STYLE.COMPACT) {
		switch (field.type) {
			case VariableType.HTML:
			case VariableType.MACRO:
				return false;
			default:
				return true;
		}
	}
	return false;
};

export const getVariableViewForPrintableReadOnlyMode = (
	properties,
	componentId,
	dispatch
) => {
	let { field, formData } = properties;
	let transformedField = transformVariable(
		cloneDeep(field),
		formData,
		dispatch
	);
	let { props, render } = glideControlElementFactory.getFormControl(
		componentId,
		transformedField.type,
		transformedField,
		createOnValueChangeHandler(SC_FORM_VALUECHANGE, dispatch),
		null,
		formData
	);
	if (!render) {
		return;
	}
	if (transformedField.type === VariableType.HTML) {
		return (
			<sn-record-control-wrapper
				{...field}
				required={field.mandatory}
				invalid={field.isInvalid}
			>
				<div className="padding-h-xs">
					<now-rich-text html={field.value} />
				</div>
			</sn-record-control-wrapper>
		);
	}
	if (transformedField.type === VariableType.TEXT_AREA) {
		return (
			<now-textarea
				{...props}
				value={field.value}
				displayValue={field.displayValue}
				className="control"
			/>
		);
	}
	if (transformedField.type === VariableType.URL) {
		return (
			<now-input-url
				{...props}
				value={field.value}
				displayValue={field.displayValue}
				className="control"
			/>
		);
	}
	if (transformedField.type === VariableType.MASKED) {
		return (
			<now-input-password
				{...props}
				requirements={[]}
				compact={true}
				value={field.value}
				displayValue={field.displayValue}
				className="control"
			/>
		);
	}
	if (transformedField.type === VariableType.MULTI_SELECT) {
		return (
			<sn-catalog-form-multiple-select
				field={transformedField}
				formData={formData}
			/>
		);
	}
	return (
		<now-input
			{...props}
			value={field.displayValue}
			displayValue={field.displayValue}
			className="control"
		/>
	);
};

export const getVariableViewForNonReadOnlyMode = (
	properties,
	componentId,
	dispatch
) => {
	let { field, formData = {}, formProps = {} } = properties;
	let transformedField = transformVariable(
		cloneDeep(field),
		formData,
		dispatch
	);
	switch (transformedField.type) {
		case VariableType.MASKED:
			return (
				<sn-catalog-form-masked-variable
					instanceId={componentId}
					field={transformedField}
					formData={formData}
					formProps={formProps}
				/>
			);
		case VariableType.CHECKBOX:
			return (
				<div className="form-control">
					<sn-catalog-form-checkbox-variable
						instanceId={componentId}
						field={transformedField}
						formData={formData}
					/>
				</div>
			);
		case VariableType.LABEL:
			return <sn-catalog-form-label-variable field={transformedField} />;
		case VariableType.RICH_TEXT_LABEL:
			return (
				<sn-catalog-form-rich-text-label-variable field={transformedField} />
			);
		case VariableType.FILE_ATTACHMENT:
			return (
				<sn-catalog-form-attachment-variable
					instanceId={componentId}
					field={transformedField}
					formData={formData}
					extensions={transformedField.extensions}
					maxAttachmentSize={transformedField.maxAttachmentSize}
				/>
			);
		case VariableType.MACRO:
			return (
				<sn-catalog-form-macro-variable
					field={transformedField}
					key={transformedField.id}
					formData={formData}
				/>
			);
		case VariableType.NUMERIC_SCALE:
		case VariableType.MULTIPLE_CHOICE:
			if (transformedField.visible == 'true') {
				return (
					<now-radio-buttons
						label={transformedField.label}
						name={transformedField.name}
						options={transformedField.options}
						layout={transformedField.choiceDirection}
						value={transformedField.value}
						required={transformedField.mandatory}
						readonly={transformedField.readonly}
						invalid={transformedField.invalid}
						helperContent={transformedField.dictionary.fieldHint}
					/>
				);
			}
			break;
		case VariableType.MULTI_SELECT:
			return (
				<sn-catalog-form-multiple-select
					field={transformedField}
					formData={formData}
				/>
			);
		default: {
			let {
				// eslint-disable-next-line no-unused-vars
				Control,
				props,
				children,
				render
			} = glideControlElementFactory.getFormControl(
				componentId,
				transformedField.type,
				transformedField,
				createOnValueChangeHandler(SC_FORM_VALUECHANGE, dispatch),
				null,
				formData
			);
			if (render) {
				return (
					<div className="form-control">
						<Control {...props}>{children}</Control>
					</div>
				);
			}
		}
	}
};

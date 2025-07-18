import _ from 'lodash';
import makeClass from 'classnames';
import { isAttrTrue } from '../utils';
import '@servicenow/now-record-list';
import { t } from 'sn-translate';
import '../variable-section';
import {
	ADD_BUTTON_CLICKED,
	REMOVE_MODAL_CLOSED,
	MULTI_ROW_FORM_MODAL_CLOSED,
	REMOVE_MODAL_CLICKED,
	REMOVE_BUTTON_CLICKED
} from './constants';
import { default as getGridProps } from './gridProps';
import '../multi-row-form-modal';
import '../sc-multi-row-action-button';

const renderHeaderButtons = (state, dispatch) => {
	const {
		properties: { field }
	} = state;
	const { isInvalid } = field;
	let wrapperClassName = makeClass(
		'sn-multirow-var-header-container form-controls',
		{
			'has-error': isAttrTrue(isInvalid)
		}
	);
	return (
		<div className={wrapperClassName}>
			<div className="sn-multirow-var-header-container-header">
				{renderHeader(field)}
			</div>
			<div className="sn-multirow-var-header-container-actions">
				{renderButtons(state, dispatch)}
			</div>
		</div>
	);
};

const renderHeader = ({ label, mandatory, isInvalid }) => {
	return (
		<sn-record-control-wrapper
			label={label}
			required={isAttrTrue(mandatory)}
			invalid={isAttrTrue(isInvalid)}
		>
			{}
		</sn-record-control-wrapper>
	);
};

const renderButtons = state => {
	const { readonly } = state;

	if (readonly) {
		return null;
	}

	const {
		maxRows = Number.POSITIVE_INFINITY,
		currentRows,
		rowSelection: { selectedRecords = [] }
	} = state;

	return (
		<div>
			<sc-multi-row-header-action-button
				onClickAction={ADD_BUTTON_CLICKED}
				label={t('Add')}
				variant="primary"
				size="sm"
				className="sn-multirow-var-button"
				disabled={maxRows <= currentRows}
			/>
			<sc-multi-row-header-action-button
				onClickAction={REMOVE_MODAL_CLICKED}
				label={t('Remove')}
				variant="secondary"
				size="sm"
				className="sn-multirow-var-button"
				disabled={selectedRecords.length === 0}
			/>
		</div>
	);
};

const renderGrid = state => {
	const {
		properties,
		rowSelection: { allSelectedOnPage, selectedRecords }
	} = state;
	let { field, rowData } = properties;

	if (_.size(field) === 0) {
		return null;
	}

	return (
		<now-table
			{...getGridProps(field, rowData, allSelectedOnPage, selectedRecords)}
		>
			{''}
		</now-table>
	);
};

const renderModalSection = state => {
	const { popoverActive, rowSysId = null, mode = 'add' } = state;
	const {
		properties: {
			field = {},
			sourceTable,
			sourceId,
			rowData: originalRowData,
			parentFields
		}
	} = state;
	let catalogItemId;
	if (sourceTable != 'sc_cat_item' && field['catalogItemId']) {
		catalogItemId = field['catalogItemId'];
	} else {
		catalogItemId = sourceId;
	}
	if (!isAttrTrue(popoverActive)) {
		return null;
	}
	let rowData = {};
	if (rowSysId && rowSysId > 0) {
		rowData = (((originalRowData || [])[rowSysId - 1] || {}).row || []).reduce(
			(accumulator, column = {}) => {
				accumulator[column.name] = column.value;
				return accumulator;
			},
			{}
		);
	}
	return (
		<sn-catalog-form-multi-row-form-modal
			action={mode}
			active={popoverActive}
			field={field}
			parentFields={parentFields}
			row-data={rowData}
			row-id={rowSysId}
			variable-set-id={field.id}
			variable-set-name={field.name}
			catalog-item-id={catalogItemId}
			sourceTable={sourceTable}
			sourceId={sourceId}
			onModalCloseActionType={MULTI_ROW_FORM_MODAL_CLOSED}
		/>
	);
};

const renderRemoveModalPopUp = state => {
	const {
		removePopOver,
		rowSelection: { selectedRecords = [], allSelectedOnPage = false }
	} = state;

	if (!isAttrTrue(removePopOver)) {
		return null;
	}

	const msg = selectedRecords.length > 1 ? (allSelectedOnPage ? t('Are your sure you want to remove all rows?')
																:  t('Are your sure you want to remove selected rows?'))
											: t('Are you sure you want to remove row?');

	const header = t('Confirmation');
	const primaryButtonLabel =
		selectedRecords.length > 1 ? t('Remove All') : t('Remove');
	const secondaryButtonLabel = t('Cancel');

	const footerActions = `[
		{
			"variant": "primary-negative",
			"label": "${primaryButtonLabel}",
			"clickActionType": "${REMOVE_BUTTON_CLICKED}"
		},
		{
			"variant": "secondary",
			"label": "${secondaryButtonLabel}",
			"clickActionType": "${REMOVE_MODAL_CLOSED}"
		}
	]`;

	return (
		<now-modal
			opened={true}
			manageOpened={true}
			size="sm"
			header-label={header}
			content={msg}
			footer-actions={footerActions}
		/>
	);
};

export default (state, { dispatch }) => {
	const { visible } = state;

	if (!visible) {
		return null;
	}

	return (
		<div className="sn-multirow-var">
			{renderModalSection(state)}
			{renderRemoveModalPopUp(state)}
			{renderHeaderButtons(state, dispatch)}
			{renderGrid(state)}
		</div>
	);
};

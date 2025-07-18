import {actionTypes} from '@servicenow/ui-core';
import get from 'lodash/get';
import has from 'lodash/has';
import isEmpty from 'lodash/isEmpty';
import set from 'lodash/set';
import unset from 'lodash/unset';
import {t} from 'sn-translate';

import {
	CHECKBOX_CHECKED_SET,
	GRID_CHECKBOX_TOGGLED,
	LIST_COUNT_STATUS,
	MODEL_PATH,
	SELECT_ALL_RECORDS,
	SN_GRID_CHECKBOX_ALL
} from '../../../constants';
import '../../checkbox/checkbox';
import {renderCheckBox} from '../../checkbox/checkboxRender';

const {COMPONENT_PROPERTY_CHANGED} = actionTypes;

export const PLUGIN_NAME = 'gridRowSelection';
export const BEHAVIOR_PATH = ['behaviors', PLUGIN_NAME];
export const OPTIONS_PATH = ['options', PLUGIN_NAME];

const arrayToMap = (array = []) =>
	array.reduce((obj, key) => ({...obj, [key]: ''}), {});
const getSelectedRecords = (state, path = []) =>
	get(state, [...path, 'selectedRecords'], {});

const getAllRecordsSelected = (state, path = []) =>
	get(state, [...path, 'allRecordsSelected'], false);

const getCheckedRowIndex = (state, path = []) =>
	get(state, [...path, 'checkedRowIndex'], -1);

const getIsGridEmpty = (state, path = []) =>
	get(state, [...path, 'isGridEmpty'], false);

const getHideCheckboxHover = (state, path = []) =>
	get(state, [...path, 'hideCheckboxHover'], '');

const getSelectAllStatusBar = (state, path = []) =>
	get(state, [...path, 'hasSelectAllStatusBar'], '');

const getAllSysIdsOnPage = (state, path = []) =>
	get(state, [...path, 'allSysIdsOnPage'], []);

const getHideSelectAll = (state, path = []) =>
	get(state, [...path, 'hideSelectAll'], true);

const getRecordCount = (state, path = []) =>
	get(state, [...path, 'recordCount'], 0);

const getExceptedRecords = (state, path = []) =>
	get(state, [...path, 'exceptedRecords'], 0);

export const rowSelectionSelectors = {
	getSelectedRecords,
	getAllRecordsSelected,
	getCheckedRowIndex,
	getIsGridEmpty,
	getHideCheckboxHover,
	getSelectAllStatusBar,
	getAllSysIdsOnPage,
	getHideSelectAll,
	getRecordCount,
	getExceptedRecords
};

export const rowSelectionStyleFn = (context, defaultStyle) => {
	const {row} = context;
	const {rowMetaData = {}} = row;
	const {uniqueId} = rowMetaData;

	const rowSelectionClass = getRowSelectionClass(context, uniqueId);
	const newClassName = `${rowSelectionClass} ${get(
		defaultStyle,
		'className',
		''
	)}`;
	return {className: newClassName, styles: defaultStyle.style};
};

export const getRowSelectionClass = (context, uniqueId) => {
	const selectedRecords = rowSelectionSelectors.getSelectedRecords(
		context.properties,
		OPTIONS_PATH
	);
	const allRowsSelected = rowSelectionSelectors.getAllRecordsSelected(
		context.properties,
		OPTIONS_PATH
	);

	const isChecked =
		get(selectedRecords, uniqueId) !== undefined || allRowsSelected;
	return isChecked ? 'is-checked' : '';
};

export const rowSelectorColDef = (allSysIds, hideCheckboxHover) => ({
	field: 'row_selector',
	heading: ({props}) => {
		const selectedRecords = rowSelectionSelectors.getSelectedRecords(props);
		const {data = []} = props;
		const checked = data.length === Object.keys(selectedRecords).length;
		return (
			<div className="sn-grid-header-btn">
				<now-table-checkbox
					label={'TEST LABEl'}
					checked-value={checked}
					value={SN_GRID_CHECKBOX_ALL}
					data={{value: allSysIds}}
					disabled={false}
					className="headerButtonPadding"
				/>
			</div>
		);
	},
	width: 24,
	textAlign: 'center',
	verticalAlign: 'center',
	type: 'row_selector',
	allSysIds: allSysIds,
	hideCheckboxHover: hideCheckboxHover,
	format: ({
		dispatch,
		props,
		props: {hideCheckboxHover},
		row: {
			rowMetaData: {uniqueId}
		},
		row: rowIndex
	}) => {
		const checkboxID = uniqueId + '_row_checkbox';
		const selectedRecords = rowSelectionSelectors.getSelectedRecords(props);
		const checked = has(selectedRecords, uniqueId);

		const checkboxVisibility = !hideCheckboxHover || !isEmpty(selectedRecords);

		const checkboxClass = checkboxVisibility ? '' : 'hide-checkboxes';

		const checkboxClasses = [
			'sn-grid-checkbox-label',
			checkboxClass,
			checked ? 'is-selected' : '' //,index === checkedRowIndex ? 'checkbox-shift' : ''
		];

		// Screenreaders start counting rows at 1 (not 0)
		// and start counting with header rows so 2 is added.
		// 3 is added when the select all dialogue header row is active.
		// const checkboxSRLabel = hasSelectAllStatusBar
		// ? t('Row {0}', `${index + 3}`)
		// : t('Row {0}', `${index + 2}`); // TODO: once select all is implemented honor the flag

		const checkboxSRLabel = t('Row {0}', `${rowIndex + 2}`);

		return renderCheckBox({
			checkboxClasses,
			checkboxID,
			checkboxSRLabel,
			checked,
			rowIndex,
			dispatch,
			sysId: uniqueId,
			allSysIds
		});
	}
});

export function instantiatePlugin() {
	return {
		transform(state) {
			const {
				properties: {
					allRecordsSelected,
					listModel,
					hideCheckboxHover,
					selectedRecords,
					hideSelectAll,
					exceptedRecords
				},
				listCount
			} = state;
			const isGridEmpty =
				listModel &&
				isEmpty(get(listModel, MODEL_PATH.LAYOUT_QUERY.QUERY_ROWS));

			const listCountStatus = get(listCount, 'status', '');
			const recordCount =
				listCountStatus === LIST_COUNT_STATUS.SUCCESS
					? get(listCount, 'totalRecordCount', 0)
					: 0;
			const allSysIdsOnPage = get(
				listModel,
				MODEL_PATH.LAYOUT_QUERY.ALL_SYS_IDS,
				[]
			);
			return {
				...state,
				options: {
					...state.options,
					gridRowSelection: {
						allRecordsSelected,
						isGridEmpty,
						hideCheckboxHover,
						allSysIdsOnPage,
						hideSelectAll,
						recordCount,
						exceptedRecords,
						selectedRecords: arrayToMap(selectedRecords)
					}
				}
			};
		},
		behavior: {
			name: PLUGIN_NAME,
			actionHandlers: {
				[COMPONENT_PROPERTY_CHANGED]: coeffects => {
					const {
						action: {
							payload: {name, value}
						},
						updateState
					} = coeffects;

					if (name === 'selectedRecords' && Array.isArray(value)) {
						updateState({
							path: `behaviors.${PLUGIN_NAME}.selectedRecords`,
							value: arrayToMap(value),
							operation: 'set',
							shouldRender: false
						});
					}
					if (name === 'page') {
						updateState({
							path: `behaviors.${PLUGIN_NAME}.checkedRowIndex`,
							value: -1,
							operation: 'set',
							shouldRender: false
						});
					}
				},
				[CHECKBOX_CHECKED_SET]: ({
					action,
					updateState,
					state,
					properties: {hideShiftRecordSelection, listModel},
					dispatch
				}) => {
					const {
						payload,
						payload: {
							checked,
							allSysIds,
							shiftKey,
							checkedRowIndex: newCheckedRowIndex
						}
					} = action;
					let value = get(payload, 'value', '');

					const stateRecordsSelected = rowSelectionSelectors.getSelectedRecords(
						state,
						BEHAVIOR_PATH
					);
					const checkedRowIndex = rowSelectionSelectors.getCheckedRowIndex(
						state,
						BEHAVIOR_PATH
					);

					if (shiftKey && checkedRowIndex >= 0) {
						const startIndex = Math.min(newCheckedRowIndex, checkedRowIndex);
						const endIndex = Math.max(newCheckedRowIndex, checkedRowIndex);
						value = allSysIds.slice(startIndex, endIndex + 1);
					}

					(Array.isArray(value) ? value : [value]).forEach(uniqueId => {
						if (checked) set(stateRecordsSelected, [uniqueId], '');
						else unset(stateRecordsSelected, [uniqueId]);
					});

					updateState({
						path: `behaviors.${PLUGIN_NAME}`,
						value: {
							selectedRecords: stateRecordsSelected,
							checkedRowIndex: hideShiftRecordSelection
								? checkedRowIndex
								: newCheckedRowIndex
						},
						operation: 'set',
						shouldRender: false
					});

					dispatch(GRID_CHECKBOX_TOGGLED, {
						...payload,
						value,
						allSysIdsOnPage: allSysIds,
						totalRecordCount: get(listModel, MODEL_PATH.LAYOUT_QUERY.COUNT, 0)
					});
					action.stopPropagation();
				},
				[SELECT_ALL_RECORDS]: ({action, updateState}) => {
					const {
						payload: {selectedRecords}
					} = action;
					updateState({
						path: `behaviors.${PLUGIN_NAME}`,
						value: {
							selectedRecords: arrayToMap(selectedRecords)
						},
						operation: 'set',
						shouldRender: false
					});
				}
			}
		}
	};
}

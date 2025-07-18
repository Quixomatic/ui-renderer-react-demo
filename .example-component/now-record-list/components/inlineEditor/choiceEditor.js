import '@devsnc/sn-record-annotation';
import '@devsnc/sn-record-choice-connected';
import '@servicenow/now-button';
import '@servicenow/now-loader';

import {
	NOW_GRID_CLOSE_POPOVER,
	NOW_GRID_OPEN_POPOVER,
	NOW_GRID_REFIT_POPOVER
} from '@servicenow/now-grid';
import {actionTypes, createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import {t} from 'sn-translate';

import {
	BUTTON_CLICKED,
	CHOICE_VALUE_MAP_CHANGED,
	COMPONENT_PROPERTY_CHANGED,
	INLINE_EDITING_PREFETCH_DEPENDENT_REQUEST,
	INLINE_EDITING_WRITE_REQUEST,
	SAVE_CHOICES_EFFECT
} from '../../constants';
import {INLINE_CELL_POPOVER_POSITIONS} from '../nowGrid/columnTypes/constants';

import styles from './styles.scss';
import {getInlineAnnotations} from './utils';

const {COMPONENT_BOOTSTRAPPED, COMPONENT_TREE_RENDERED} = actionTypes;

export const INLINE_EDIT_DEPENDENT_COMPONENT_NAME =
	'sn-record-list-inline-editor-dependent';

const saveComponentName = 'OK';
const cancelComponentName = 'CANCEL';

const cancelAriaConfig = {'aria-label': t('Cancel')};
const okAriaConfig = {'aria-label': t('Ok')};

const cancelTranslated = t('Cancel');
const okTranslated = t('Ok');

export const view = (state, {dispatch}) => {
	const {
		properties: {
			popoverStyle,
			gridCellRef,
			prefetchData: {
				canListEditMap = {},
				numRecords,
				numEditableRecords,
				numVerifiedRecords
			}
		},
		saving,
		updatedChoiceValueMap
	} = state;

	if (saving) {
		dispatch(NOW_GRID_OPEN_POPOVER, {
			popoverTargetRef: gridCellRef,
			popoverPositions: INLINE_CELL_POPOVER_POSITIONS
		});

		const loaderStyle = {
			...popoverStyle,
			display: 'flex',
			'align-items': 'center',
			'justify-content': 'center'
		};
		return (
			<div style={loaderStyle}>
				<now-loader />
			</div>
		);
	}

	const onValueChange = ({name, value}) => {
		const prevValue = updatedChoiceValueMap[name];

		// check if value has actually changed
		if (value?.toLowerCase() === prevValue?.toLowerCase()) {
			return;
		}

		dispatch(CHOICE_VALUE_MAP_CHANGED, {
			value,
			name
		});
	};

	const canListEdit = Object.values(canListEditMap).includes(true);
	const content = getContent(state, onValueChange, canListEdit);
	const annotations = getInlineAnnotations(
		numRecords,
		numEditableRecords,
		numVerifiedRecords
	);

	return (
		<div className="dependent-field-editor">
			{content}
			<div className={'dependent-field-buttons-container'}>
				<now-button
					tooltip-content={cancelTranslated}
					className="clear-button"
					variant="tertiary"
					config-aria={cancelAriaConfig}
					size="sm"
					label={cancelTranslated}
					component-name={cancelComponentName}
				/>
				<now-button
					tooltip-content={okTranslated}
					className="apply-button"
					variant="secondary"
					config-aria={okAriaConfig}
					size="sm"
					label={okTranslated}
					component-name={saveComponentName}
					disabled={!canListEdit}
				/>
			</div>
			{!isEmpty(annotations) ? (
				<sn-record-annotation important>{annotations}</sn-record-annotation>
			) : null}
		</div>
	);
};

const getContent = (state, onValueChange, canListEdit) => {
	const {
		properties: {
			prefetchData: {verifiedTable = '', verifiedSysId = '', dependentList = []}
		},
		recordSysId,
		tableName,
		updatedDependentValue,
		updatedDependentField,
		updatedChoiceValueMap
	} = state;

	const formData = {
		serializedChanges: createSerializedChanges(updatedChoiceValueMap)
	};

	return dependentList.map(dependent => {
		const {name, dependentOnField, label, value} = dependent;

		const initialValue = updatedChoiceValueMap[name] || value;

		const choices = dependent.choiceFields.map(choice => ({
			displayValue: choice.displayValue,
			value: choice.rawValue
		}));

		// tells choice connected which fields to display since they depend other choices
		const dependentValue =
			dependentOnField === updatedDependentField
				? updatedDependentValue
				: undefined;
		const dependentField =
			name == updatedDependentField ? undefined : updatedDependentField;

		const controlProps = {
			initialValue,
			dependentValue,
			dependentField,
			label: label,
			name: name,
			recordSysId: verifiedSysId || recordSysId,
			tableName: verifiedTable || tableName,
			onValueChange,
			formData,
			readonly: !canListEdit,
			disabled: !canListEdit,
			choices
		};

		return <sn-record-choice-connected {...controlProps} />;
	});
};

const bootstrapEffect = ({state, dispatch}) => {
	const {fieldName, recordSysId, tableName, selectedSysIds} = state.properties;

	dispatch(INLINE_EDITING_PREFETCH_DEPENDENT_REQUEST, {
		table: tableName,
		selectedSysId: recordSysId,
		column: fieldName,
		sysIds: selectedSysIds
	});
};

const handlePropertyChanged = coeffects => {
	const {
		action: {payload},
		updateState
	} = coeffects;
	const {name, value} = payload;

	if (name !== 'prefetchData') return;

	updateState({
		updatedChoiceValueMap: get(value, 'choiceValueMap', {})
	});
};

const createSerializedChanges = choiceValueMap => {
	const changes = Object.entries(choiceValueMap).map(([key, value]) => ({
		name: key,
		value: value
	}));

	return JSON.stringify(changes);
};

const findDependencies = (dependentList, independentField) => {
	const independentFields = [independentField];

	return dependentList
		.map(dependent => {
			const {name, dependentOnField} = dependent;
			if (independentFields.includes(dependentOnField)) {
				independentFields.push(name);
				return name;
			}
			return undefined;
		})
		.filter(name => name !== undefined);
};

const updateChoiceValueMapChangesEffect = coeffects => {
	const {
		action: {
			payload: {name, value}
		},
		state: {
			properties: {
				prefetchData: {choiceValueMap, dependentList}
			},
			updatedChoiceValueMap
		},
		updateState
	} = coeffects;

	const dependentFields = findDependencies(dependentList, name);

	const newChoiceValueMap = {
		...choiceValueMap,
		...updatedChoiceValueMap,
		[name]: value
	};

	dependentFields.forEach(field => {
		newChoiceValueMap[field] = '';
	});

	updateState({
		updatedDependentValue: value,
		updatedDependentField: name,
		updatedChoiceValueMap: newChoiceValueMap
	});
};

const saveChoicesEffect = ({state, dispatch}) => {
	const {
		updatedChoiceValueMap,
		properties: {
			tableName,
			prefetchData: {canListEditMap, verifiedTable}
		}
	} = state;

	const newInlineValues = Object.entries(updatedChoiceValueMap).map(
		([key, value]) => {
			return {column: key, value: value || ''};
		}
	);

	const sysIds = Object.entries(canListEditMap)
		.filter(key => canListEditMap[key[0]])
		.map(key => key[0]);

	dispatch(INLINE_EDITING_WRITE_REQUEST, {
		table: verifiedTable || tableName,
		sysIds,
		multiRowInlineValue: newInlineValues
	});
};

createCustomElement(INLINE_EDIT_DEPENDENT_COMPONENT_NAME, {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		updatedDependentValue: '',
		updatedDependentField: '',
		updatedChoiceValueMap: {},
		saving: false
	},
	properties: {
		popoverStyle: {default: {}},
		fieldName: {default: ''},
		recordSysId: {default: ''},
		tableName: {default: ''},
		dependentFields: {default: []},
		selectedSysIds: {default: []},
		value: {default: ''},
		fieldValueMap: {default: {}},
		allColumns: {default: new Map()},
		prefetchData: {default: {}}
	},
	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED]: {
			effect: bootstrapEffect,
			stopPropagation: true
		},
		[COMPONENT_PROPERTY_CHANGED]: {
			effect: handlePropertyChanged,
			stopPropagation: true
		},
		[CHOICE_VALUE_MAP_CHANGED]: {
			effect: updateChoiceValueMapChangesEffect,
			stopPropagation: true
		},
		[SAVE_CHOICES_EFFECT]: {
			effect: saveChoicesEffect,
			stopPropagation: true
		},
		[BUTTON_CLICKED]: {
			effect: ({dispatch, action, updateState}) => {
				const {
					meta: {componentName}
				} = action;

				switch (componentName) {
					case saveComponentName:
						updateState({saving: true});
						dispatch(SAVE_CHOICES_EFFECT);
						break;
					case cancelComponentName:
						dispatch(NOW_GRID_CLOSE_POPOVER, {setParentFocus: true});
						break;
					default:
						break;
				}
			},
			stopPropagation: true
		},
		[COMPONENT_TREE_RENDERED]: {
			modifier: {name: 'debounce', delay: 100},
			effect: ({dispatch}) => {
				dispatch(NOW_GRID_REFIT_POPOVER);
			}
		}
	},
	styles
});

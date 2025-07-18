import '@servicenow/now-heading';
import '@servicenow/now-typeahead';
import {Logger} from '@devsnc/sn-list-commons';
import tooltipBehavior from '@servicenow/behavior-tooltip';
import truncationBehavior from '@servicenow/behavior-truncation';
import {NOW_GRID_REFIT_POPOVER} from '@servicenow/now-grid';
import {actionTypes, createCustomElement} from '@servicenow/ui-core';
import {createGraphQLEffect} from '@servicenow/ui-effect-graphql';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import difference from 'lodash/difference';
import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';

import {
	COMPONENT_PROPERTY_CHANGED,
	INLINE_EDITING_PREFETCH_REQUEST
} from '../../constants';
import {getInlineAnnotations} from '../inlineEditor/utils';

import {
	ADD_TAG,
	ADD_TAG_INPUT_ID,
	CREATE_TAG,
	CREATE_TAG_LABEL_ENTRIES,
	CREATE_TAG_SUCCESS,
	FETCH_TAGS_WITH_PREFIX,
	FETCH_TAGS_WITH_PREFIX_SUCCESS,
	HAS_TAG_CHECK,
	HAS_TAG_CHECK_SUCCESS,
	NOW_TYPEAHEAD_ENTER_KEYDOWN,
	NOW_TYPEAHEAD_SELECTED_ITEM_SET,
	NOW_TYPEAHEAD_VALUE_SET,
	PREPARE_LABEL_ENTRIES_REQUEST,
	TAGS,
	TAG_GRAPGQL_FAILURE,
	VIEWABLE_BY
} from './constants';
import {TAG_CREATE, TAG_PREFIX_GET_QUERY} from './tagQueries';
import {createPillFromTag} from './tagRender';
import styles from './tags.scss';

const {COMPONENT_BOOTSTRAPPED} = actionTypes;
const LOG = Logger().createLog('Tag Editor');

const fetchTagsWithPrefix = createGraphQLEffect(TAG_PREFIX_GET_QUERY, {
	variableList: ['prefix'],
	successActionType: FETCH_TAGS_WITH_PREFIX_SUCCESS,
	errorActionType: TAG_GRAPGQL_FAILURE
});

const hasTagCheck = createGraphQLEffect(TAG_PREFIX_GET_QUERY, {
	variableList: ['prefix'],
	successActionType: HAS_TAG_CHECK_SUCCESS,
	errorActionType: TAG_GRAPGQL_FAILURE
});

const createTag = createGraphQLEffect(TAG_CREATE, {
	variableList: ['text'],
	successActionType: CREATE_TAG_SUCCESS,
	errorActionType: TAG_GRAPGQL_FAILURE
});

export const tagListSection = (tagList, viewableBy) => {
	if (!tagList?.length) {
		return null;
	}

	return (
		<div className="sn-tag-component-section">
			<span data-truncation className="sn-tag-component-sectionheader">
				{viewableBy}
			</span>
			<div data-truncation className="sn-tag-component-tags-list">
				{tagList}
			</div>
		</div>
	);
};

export const createTagSections = (tagList = [], dispatch) => {
	const me = [];
	const groups = [];
	const everyone = [];
	const isPillContainerWrapped = true;

	if (tagList) {
		tagList
			.sort((tag1, tag2) => tag1.name.localeCompare(tag2.name))
			.forEach(tag => {
				const pill = createPillFromTag(tag, isPillContainerWrapped, dispatch);
				switch (tag.viewableBy) {
					case VIEWABLE_BY.EVERYONE.value:
						everyone.push(pill);
						break;
					case VIEWABLE_BY.GROUPS_AND_USERS.value:
						groups.push(pill);
						break;
					default:
						me.push(pill);
				}
			});
	}
	return {me, groups, everyone};
};

export const bootstrapEffect = ({state: {properties}, dispatch}) => {
	const {
		tableName,
		fieldName,
		selectedSysIds,
		recordSysId,
		fieldType
	} = properties;
	dispatch(INLINE_EDITING_PREFETCH_REQUEST, {
		table: tableName,
		column: fieldName,
		sysIds: selectedSysIds,
		selectedSysId: recordSysId,
		fieldType
	});
};

export const componentPropertyChangedEffect = ({
	action: {
		payload: {name}
	},
	dispatch
}) => {
	if (name === 'tagList') {
		dispatch(NOW_GRID_REFIT_POPOVER);
	}
};

export const suggestTags = ({action: {payload}, dispatch, updateState}) => {
	const {value} = payload;
	updateState({path: 'value', value, operation: 'set'});
	const prefix = value.trim();
	if (!prefix) {
		updateState({path: 'suggestions', value: [], operation: 'set'});
		return;
	}
	dispatch(FETCH_TAGS_WITH_PREFIX, {prefix});
};

export const fetchTagsWithPrefixSuccess = ({
	action: {payload},
	updateState
}) => {
	const records = get(
		payload,
		'data.GlideViewableTagQuery_Query.viewableUserTags.records',
		[]
	);

	const suggestions = records.map(({sysId, name, viewableBy}) => ({
		id: sysId,
		label: name,
		sublabel: viewableBy
	}));

	updateState({
		path: 'suggestions',
		value: suggestions,
		operation: 'set'
	});
};

export const hasTagCheckSuccess = ({action: {payload, meta}, dispatch}) => {
	const tagName = get(meta, 'options.variables.prefix', '');
	const records = get(
		payload,
		'data.GlideViewableTagQuery_Query.viewableUserTags.records',
		[]
	);
	const tag = records.find(record => record.name === tagName);
	if (tag) {
		dispatch(PREPARE_LABEL_ENTRIES_REQUEST, {tagId: tag.sysId});
	} else {
		dispatch(CREATE_TAG, {
			text: tagName
		});
	}
};

export const createTagSuccess = ({action: {payload}, dispatch}) => {
	const tagId = get(
		payload,
		'data.GlideRecord_Mutation.insert_label.sys_id.value',
		''
	);
	if (tagId) {
		dispatch(PREPARE_LABEL_ENTRIES_REQUEST, {tagId});
	}
};

export const tagSelected = ({action: {payload}, dispatch}) => {
	const {item} = payload;
	if (item?.id) {
		dispatch(PREPARE_LABEL_ENTRIES_REQUEST, {tagId: item.id});
	}
};

export const tagEntered = ({state, dispatch}) => {
	const {value} = state;
	const tagValue = value.trim();
	if (!tagValue) return;

	const tagObject = state.suggestions.find(
		tag => tag.label.toLowerCase() === tagValue.toLowerCase()
	);

	if (!tagObject) {
		dispatch(HAS_TAG_CHECK, {prefix: tagValue});
	} else {
		dispatch(PREPARE_LABEL_ENTRIES_REQUEST, {tagId: tagObject.id});
	}
};

export const prepareLabelEntriesRequest = ({
	action: {payload},
	state: {properties},
	dispatch,
	updateState
}) => {
	const {tagId} = payload;
	const {tagList, selectedSysIds, tableName: table} = properties;

	const existingTag = tagList.find(tag => tag.sysId === tagId);
	let recordSysIds = selectedSysIds;

	if (existingTag) {
		const {rowId} = existingTag;
		recordSysIds = difference(selectedSysIds, rowId);
	}

	if (recordSysIds.length && table && tagId) {
		dispatch(CREATE_TAG_LABEL_ENTRIES, {table, tagId, recordSysIds});
		updateState(
			{path: 'value', value: '', operation: 'set'},
			{path: 'suggestions', value: [], operation: 'set'}
		);
	}
};

const view = (state, {dispatch}) => {
	const {
		suggestions,
		value,
		properties: {
			popoverStyle,
			tagList,
			prefetchData: {numRecords, numEditableRecords, numVerifiedRecords}
		}
	} = state;

	const annotations = getInlineAnnotations(
		numRecords,
		numEditableRecords,
		numVerifiedRecords
	);

	const {me, groups, everyone} = createTagSections(tagList, dispatch);

	return (
		<div className="sn-tag-component">
			<div className="sn-tag-component-header-container">
				<now-heading label={TAGS} variant="header-tertiary" />
			</div>
			<div className="sn-tag-component-filter">
				<now-typeahead
					id={ADD_TAG_INPUT_ID}
					label={ADD_TAG}
					items={suggestions}
					value={value}
					autofocus
					manage-value
				/>
			</div>
			<div className="sn-tag-component-sections">
				{tagListSection(me, VIEWABLE_BY.ME.displayValue)}
				{tagListSection(groups, VIEWABLE_BY.GROUPS_AND_USERS.displayValue)}
				{tagListSection(everyone, VIEWABLE_BY.EVERYONE.displayValue)}
			</div>
			{!isEmpty(annotations) ? (
				<div style={popoverStyle}>
					<sn-record-annotation important>{annotations}</sn-record-annotation>
				</div>
			) : null}
		</div>
	);
};

createCustomElement('sn-record-list-inline-editor-tags', {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		suggestions: [],
		value: ''
	},
	properties: {
		tagList: {default: []},
		fieldName: {default: ''},
		fieldType: {default: ''},
		tableName: {default: ''},
		selectedSysIds: {default: []},
		prefetchData: {default: {}},
		popoverStyle: {default: {}},
		recordSysId: {default: ''}
	},
	behaviors: [tooltipBehavior, truncationBehavior],
	actionHandlers: {
		[COMPONENT_BOOTSTRAPPED]: {
			effect: bootstrapEffect,
			stopPropagation: true
		},
		[COMPONENT_PROPERTY_CHANGED]: {
			effect: componentPropertyChangedEffect,
			stopPropagation: true
		},
		[NOW_TYPEAHEAD_VALUE_SET]: {
			effect: suggestTags,
			modifier: {name: 'debounce', delay: 150},
			stopPropagation: true
		},
		[NOW_TYPEAHEAD_SELECTED_ITEM_SET]: {
			effect: tagSelected,
			modifier: {name: 'debounce', delay: 200},
			stopPropagation: true
		},
		[NOW_TYPEAHEAD_ENTER_KEYDOWN]: {
			effect: tagEntered,
			modifier: {name: 'debounce', delay: 300},
			stopPropagation: true
		},
		[PREPARE_LABEL_ENTRIES_REQUEST]: {
			effect: prepareLabelEntriesRequest,
			stopPropagation: true
		},
		[FETCH_TAGS_WITH_PREFIX]: {
			...fetchTagsWithPrefix,
			stopPropagation: true
		},
		[FETCH_TAGS_WITH_PREFIX_SUCCESS]: {
			effect: fetchTagsWithPrefixSuccess,
			stopPropagation: true
		},
		[HAS_TAG_CHECK]: {
			...hasTagCheck,
			stopPropagation: true
		},
		[HAS_TAG_CHECK_SUCCESS]: {
			effect: hasTagCheckSuccess,
			stopPropagation: true
		},
		[CREATE_TAG]: {
			...createTag,
			stopPropagation: true
		},
		[CREATE_TAG_SUCCESS]: {
			effect: createTagSuccess,
			stopPropagation: true
		},
		[TAG_GRAPGQL_FAILURE]: {
			effect: ({action}) => {
				LOG.error(`ERROR: ${action}`);
			},
			stopPropagation: true
		}
	},
	styles: `${styles}`
});

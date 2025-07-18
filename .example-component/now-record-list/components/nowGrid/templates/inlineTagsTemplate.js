import '../../tags/tagEditor';
import get from 'lodash/get';

export const inlineTagsTemplateName = 'inlineTagsPopoverTemplate';

export const inlineTagsTemplateRender = context => {
	const {
		popoverContext: {componentProps = {}},
		properties,
		rowData
	} = context;

	const {
		fieldName,
		fieldType,
		tableName,
		selectedSysIds,
		popoverStyle,
		recordSysId
	} = componentProps;

	const inlineEditorPrefetchState = get(
		properties,
		'options.recordData.inlineEditorPrefetchState',
		{}
	);

	const tagList = getSelectedRowTags(rowData, selectedSysIds);

	return (
		<sn-record-list-inline-editor-tags
			tagList={tagList}
			fieldName={fieldName}
			fieldType={fieldType}
			tableName={tableName}
			selectedSysIds={selectedSysIds}
			popoverStyle={popoverStyle}
			prefetchData={inlineEditorPrefetchState}
			recordSysId={recordSysId}
		/>
	);
};

//This method prepares the tag object array for the popover and each tag in it refers to the rows and labelEntries it is associated with.
export const getSelectedRowTags = (rows = [], focusedSysIds) => {
	const selectedRows = rows.reduce((selectedRows, {rowMetaData, groupRows}) => {
		// for collapsible row, filter through all rows of groupRows key
		if (groupRows && groupRows.length > 0) {
			const selectedGroupRows = groupRows.filter(({rowMetaData: {uniqueId}}) =>
				focusedSysIds.includes(uniqueId)
			);
			return selectedRows.concat(selectedGroupRows);
		} else if (focusedSysIds.includes(rowMetaData?.uniqueId)) {
			return [...selectedRows, {rowMetaData}];
		}
		return selectedRows;
	}, []);

	//single row Select
	if (selectedRows.length === 1) {
		const tags = get(selectedRows[0], 'rowMetaData.tags', []);
		return tags.map(tag => ({
			...tag,
			labelEntry: [tag.labelEntry],
			rowId: focusedSysIds
		}));
	}
	return getMultiSelectedRowTags(selectedRows);
};

/**
 *
 * @param {Array} selectedRows
 * @returns Array of tags - each object has the rowId's for which it is added to and it's labelEntries
 *
 */
const getMultiSelectedRowTags = selectedRows => {
	const cumulativeTags = {};
	selectedRows.forEach(({rowMetaData: {uniqueId, tags}}) => {
		tags.forEach(tag => {
			const {sysId: id, labelEntry} = tag;
			if (cumulativeTags[id]) {
				cumulativeTags[id].labelEntry.push(labelEntry);
				cumulativeTags[id].rowId.push(uniqueId);
			} else {
				cumulativeTags[tag.sysId] = {
					...tag,
					labelEntry: [labelEntry],
					rowId: [uniqueId]
				};
			}
		});
	});
	return Object.values(cumulativeTags);
};

import _ from 'lodash';
import { isAttrTrue } from '../utils';
import { t } from 'sn-translate';

const CHECKBOX_TYPE = '7';
const MASKED_TYPE = '25';
const TRUE_DISPLAY_VALUE = t('true');
const FALSE_DISPLAY_VALUE = t('false');

//To satisfy now-table
const parsedQueryModel = {
	glideQuery: {
		predicates: [
			{
				type: 'compound',
				compound_type: 'or',
				is_related: false,
				gq_comp_maps: {
					comparison_id_map: {},
					comparison_field_count_map: {}
				},
				subpredicates: [
					{
						type: 'compound',
						compound_type: 'and',
						is_related: false,
						gq_comp_maps: {
							comparison_id_map: {},
							comparison_field_count_map: {}
						},
						subpredicates: [
							{
								type: 'compound',
								compound_type: 'and',
								is_related: false,
								gq_comp_maps: {
									comparison_id_map: {},
									comparison_field_count_map: {}
								},
								subpredicates: []
							}
						]
					}
				]
			}
		],
		order_by: [],
		group_by: [],
		comparison_id_map: {},
		comparison_field_count_map: {}
	},
	count: 0,
	fixedQueries: [],
	queryString: ''
};

const agumentDisplayValueByType = (type, value, displayValue) => {
	if (type === CHECKBOX_TYPE) {
		return String(value) === 'true' ? TRUE_DISPLAY_VALUE : FALSE_DISPLAY_VALUE;
	} else if (type === MASKED_TYPE) {
		return String(value) === '' ? '' : '*******';
	}
	return displayValue;
};

/**
 * gridModel has the following structure
 *
 * allSysIdsOnPage = []
 *  columns: [
 *      elementName: String,
 *      dictionaryData: {
 *          label: String,
 *          internalType: String,
 *          isFilterable: Boolean,
 *			isSortable: Boolean,
 *          isGroupable: Boolean,
 *          isChoice: Boolean
 *      },
 *      ...
 *  ]
 *  count: Integer,
 *  data: [
 *      elementName: {displayValue: String}
 *      ...
 *      cells: [
 *          {
 *              displayValue: String,
 *              htmlValue: String,
 *              value: String,
 *              column: String,
 *              internalType: String
 *          },
 *          ...
 *      ]
 *  ],
 *  encodedQueryString: String,
 *  errorMessage: Object,
 *  preferenceData: Array,
 *  tableMetadata: {
 *      canCreate: Boolean,
 *      canRead: Boolean,
 *      canDelete: Boolean,
 *      hasTextIndex: Boolean,
 *      isScriptableTable: Boolean
 *  },
 *  tableConditions: [],
 *  visible: Integer,
 *  selectedListId: 'default'
 */
const getGridModelAndColumnMeta = (fields, rowData) => {
	//To satisfy now-table
	const isFilterable = false;
	const isSortable = false;
	const isGroupable = false;
	const isChoice = false;

	const encodedQueryString = '';
	const errorMessage = null;
	const preferenceData = [];
	const tableMetadata = {
		canCreate: true,
		canWrite: true,
		canDelete: true,
		hasTextIndex: false,
		isScriptableTable: false
	};
	const tableConditions = [];
	const visible = 100;
	const selectedListId = 'default';

	const allSysIdsOnPage = [];

	//All that matters start here
	const columns = new Map();

	//To reduce one more loop
	const idToNameMap = {};

	_.forEach(fields, field => {
		idToNameMap[field.id] = field.name;

		columns.set(field.name, {
			columnName: field.name,
			columnData: {
				label: field.label,
				internalType: 'string',
				isFilterable,
				isChoice,
				isGroupable,
				isSortable
			}
		});
	});

	const data = new Map();

	_.forEach(rowData, ({ row }) => {
		const rowMap = row.reduce((acc, cell) => {
			acc[cell.name] = cell;
			return acc;
		}, {});
		const rowSysId = data.size;
		const rowData = new Map();
		_.forEach(fields, field => {
			const cell = rowMap[field.name];
			if (idToNameMap[cell.id]) {
				rowData.set(idToNameMap[cell.id], {
					columnName: idToNameMap[cell.id],
					columnData: {
						displayValue: agumentDisplayValueByType(
							field.type,
							cell.value,
							cell.displayValue
						),
						htmlValue: agumentDisplayValueByType(
							field.type,
							cell.value,
							cell.displayValue
						),
						value: cell.value,
						columnName: idToNameMap[cell.id],
						internalType: 'string'
					}
				});
			}
		});
		data.set(rowSysId, {
			uniqueId: rowSysId,
			rowData,
			highlightedData: new Map()
		});
		allSysIdsOnPage.push(rowSysId);
	});

	const gridModel = {
		layoutQuery: {
			queryRows: data,
			allSysIds: allSysIdsOnPage,
			count: allSysIdsOnPage.length
		},
		allColumns: columns,
		encodedQueryString,
		errorMessage,
		preferenceData,
		tableMetadata,
		tableConditions,
		visible,
		selectedListId
	};
	return {
		gridModel,
		columns
	};
};

export default (
	{ fields = [], readonly, sys_id, label },
	rowData,
	allSelectedOnPage,
	selectedRecords = []
) => {
	const { gridModel, columns } = getGridModelAndColumnMeta(fields, rowData);

	return {
		parsedQueryModel,
		gridModel,
		columns,
		hideCellFilter: true,
		hideCheckboxHover: true,
		hideColumnSorting: true,
		hideColumnResizing: true,
		hideQuickEdit: isAttrTrue(readonly),
		hideColumnGrouping: true,
		hideColumnFiltering: true,
		hideLinks: true,
		hideHighlightedValues: true,
		hideRowSelector: isAttrTrue(readonly),
		hideCheckboxes: isAttrTrue(readonly),
		hideSelectAll: true,
		hideEmptyStateImage: true,
		hideShiftRecordSelection: true,
		loading: false,
		orderBy: {},
		listInstanceId: sys_id,
		listTitle: label,
		ariaTitle: label,
		wordWrap: false,
		isRefList: false,
		checkedRowIndex: -1,
		selectedRecords,
		exceptedRecords: [],
		allRecordsSelected: false,
		scrollHandlerThrottle: 1000,
		isDirty: false,
		allSelectedOnPage
	};
};

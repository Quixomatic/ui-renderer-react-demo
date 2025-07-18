import gridCommons from '@servicenow/now-grid-commons';
import flow from 'lodash/flow';
import get from 'lodash/get';
import set from 'lodash/set';
import {memoizeDeep} from 'seismic-memo-utils';

import {rowSelectionStyleFn} from '../rowSelection/rowSelection';

import {bodyTemplateRenderer} from './body';
import {renderBodyCell} from './bodyCell';
import {
	cellFilteringTemplateName,
	cellFilteringTemplateRender
} from './cellFilteringPopoverTemplate';
import {
	columnFilteringTemplateName,
	columnFilteringTemplateRender
} from './columnFilteringPopoverTemplate';
import {default as groupedRowTemplateRenderer} from './groupedRowTemplate';
import {renderHeaderCell} from './headerCell';
import {renderHeaderRow} from './headerRow';
import {
	inlineDependentTemplateName,
	inlineDependentTemplateRender
} from './inlineDependentPopoverTemplate';
import {
	inlineEditTemplateName,
	inlineEditTemplateRender
} from './inlineEditPopoverTemplate';
import {
	inlineTagsTemplateName,
	inlineTagsTemplateRender
} from './inlineTagsTemplate';
import {
	inlineTooltipTemplateName,
	inlineTooltipTemplateRender
} from './inlineTooltipPopoverTemplate';
import {renderTable} from './table';

const {
	dragDropTemplate: {defaultTemplates}
} = gridCommons;

export const generateTransform = () => {
	const generateTemplates = options => {
		const properties = {options};
		return {
			table: {
				render: renderTable,
				properties,
				templates: {
					bodyCell: {
						render: renderBodyCell,
						properties
					},
					bodyRow: {
						render: defaultTemplates.bodyRow,
						templates: {
							bodyCell: {
								render: renderBodyCell,
								properties
							}
						},
						properties
					},
					body: {
						render: bodyTemplateRenderer,
						templates: {
							groupedRow: {
								render: groupedRowTemplateRenderer,
								properties
							},
							bodyRow: {
								render: defaultTemplates.bodyRow,
								templates: {
									bodyCell: {
										render: renderBodyCell,
										properties
									}
								},
								properties: {
									...properties,
									style: rowSelectionStyleFn
								}
							},
							properties
						},
						properties
					},
					headCell: {
						render: renderHeaderCell,
						properties
					},
					headRow: {
						render: renderHeaderRow,
						templates: {
							headCell: {
								render: renderHeaderCell,
								properties
							}
						},
						properties
					}
				}
			},
			[columnFilteringTemplateName]: {
				render: columnFilteringTemplateRender,
				properties
			},
			[cellFilteringTemplateName]: {
				render: cellFilteringTemplateRender,
				properties
			},
			[inlineTooltipTemplateName]: {
				render: inlineTooltipTemplateRender,
				properties
			},
			[inlineDependentTemplateName]: {
				render: inlineDependentTemplateRender,
				properties
			},
			[inlineEditTemplateName]: {
				render: inlineEditTemplateRender,
				properties
			},
			[inlineTagsTemplateName]: {
				render: inlineTagsTemplateRender,
				properties
			}
		};
	};

	const memoizedGenerateTemplates = memoizeDeep(generateTemplates);

	const transformTemplates = state => {
		const {options, properties} = state;
		const tableMetadata = get(properties, 'listModel.tableMetadata', {});
		const genrateTemplateoptions = {...options, tableMetadata};
		const memoizedTemplate = memoizedGenerateTemplates(genrateTemplateoptions);
		set(state, 'templates', memoizedTemplate);
		return state;
	};

	return function applyStateTransformations(state, transforms) {
		return transformTemplates(flow(transforms)(state));
	};
};

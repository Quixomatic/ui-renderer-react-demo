import {applyStyle, renderTemplate} from '@servicenow/now-grid';
import get from 'lodash/get';
import has from 'lodash/get';

export const bodyTemplateRenderer = context => {
	const {templates, rowData, properties} = context;
	const dropZone = get(properties, 'options.dropZone', '');

	return (
		<tbody
			className={`table-body ${dropZone} `}
			{...applyStyle(properties.style, context)}>
			{rowData.map((row, rowIndex) => {
				const isGrouped = has(row, 'groupRows');
				const isCollapsed = get(row, 'isCollapsed', false);
				if (isGrouped)
					return renderTemplate('groupedRow', templates, {
						...context,
						isCollapsed,
						row,
						rowIndex
					});

				const dataId = get(row, 'rowMetaData.uniqueId');
				return renderTemplate('bodyRow', templates, {
					...context,
					row,
					rowIndex,
					dataId
				});
			})}
		</tbody>
	);
};

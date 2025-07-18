import '@servicenow/now-accordion';
import {dangerouslyCreateElementFromString} from '@servicenow/ui-renderer-snabbdom';
import get from 'lodash/get';
import {t} from 'sn-translate';

export const getCascadeText = (numRecords, content) =>
	t(
		'Deleting these {0} record(s) will result in automatic deletion of {1} related record(s).',
		`<b>${numRecords}</b>`,
		`<b>${get(content, 'totalCount', 0)}</b>`
	);

export const getDbViewCascadeText = (numRecords, content) =>
	t(
		'Deleting these {0} database view record(s) will result in automatic deletion of {1} related record(s).',
		`<b>${numRecords}</b>`,
		`<b>${get(content, 'totalCount', 0)}</b>`
	);

export const getRecordText = numRecords =>
	t('Delete {0} record(s)?', `<b>${numRecords}</b>`);

export const getDbViewRecordText = numRecords =>
	t('Delete {0} database view record(s)?', `<b>${numRecords}</b>`);

export const getCascadeMessage = (msg, className = '') => {
	return dangerouslyCreateElementFromString(
		`<div ${className ? `className=${className}` : ''}>${msg}</div>`
	);
};

export const getCascadeRecordDetails = cascadeTables => {
	return cascadeTables.map(key => {
		return (
			<now-accordion-item
				header={{
					label: `${get(key, 'numRecs')} ${get(key, 'refTableName')}`,
					size: 'sm'
				}}>
				<div slot="content" className="cascade-delete-content">
					{get(key, 'recordDetails', []).map(key => {
						return (
							<p slot="content" className="cascadeContent">
								{key}
							</p>
						);
					})}
				</div>
			</now-accordion-item>
		);
	});
};

export const getCascadeDetails = parsedContent => {
	const cascadeRecords = get(parsedContent, 'cascadeRecords', []);
	return cascadeRecords.map(key => {
		const recordEntry = get(key, 'cascadeRecordName', []);
		return (
			<now-accordion
				hide-dividers
				heading-level="2"
				trigger-icon={{
					type: 'chevron',
					position: 'start'
				}}>
				<now-accordion-item header={{label: `${recordEntry}`, size: 'sm'}}>
					<now-accordion
						slot="content"
						expand-single
						hide-dividers
						heading-level="2"
						trigger-icon={{
							type: 'chevron',
							position: 'start'
						}}>
						{getCascadeRecordDetails(get(key, 'cascadeTables', []))}
					</now-accordion>
				</now-accordion-item>
			</now-accordion>
		);
	});
};

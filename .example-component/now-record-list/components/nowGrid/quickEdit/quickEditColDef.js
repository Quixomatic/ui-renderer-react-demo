import '../../checkbox/checkbox';
import {renderQuickEdit} from '../../quickEdit/quickEditRender';

export const PLUGIN_NAME = 'quickEdit';

export const quickEditColDef = () => ({
	field: 'quick_edit',
	heading: () => {
		return <div className="-quickedit"></div>;
	},
	width: 55,
	textAlign: 'center',
	verticalAlign: 'center',
	type: 'quick_edit',
	render: ({
		dispatch,
		entry: {
			rowMetaData: {uniqueId}
		}
	}) => {
		return renderQuickEdit({
			dispatch,
			rowDisplayValue: 'todo',
			rowSysId: uniqueId
		});
	}
});

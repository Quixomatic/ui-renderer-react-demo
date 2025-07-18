import fp from 'lodash/fp';
import { cloneDeep, isEmpty } from 'lodash';
import '../container-variable';
import '../variable-section';
import { renderSectionFactory, createSections } from './renderSectionFactory';
import { READONLY_OPTION, RENDER_STYLE } from '../common/constants';
const mapWithIndex = fp.map.convert({ cap: false });

export default ({ properties }) => {
	let {
		variablesLayout,
		formData = {},
		sourceTable,
		sourceId,
		fields,
		noGutter = false,
		readOnlyOption = READONLY_OPTION.DEFAULT,
		renderStyle = RENDER_STYLE.DEFAULT,
		variableGap,
		formDispatch
	} = properties;
	fields = cloneDeep(fields);
	variablesLayout = cloneDeep(variablesLayout);
	let sections = createSections(variablesLayout);
	const wrapperClassName = noGutter ? '' : 'catalog-wrapper';
	// When classicForm is 'true', date control pick date format from "window.ux_globals.presource['sn-workspace-header:wsUserData']"
	// When classicForm is 'false', date control pick date format from "formData.userSession"
	// If "userSession" is not passed in formData, we are assuming that we are loading in classic form modee
	const gFormData = {
		tableName: sourceTable,
		sysId: sourceId,
		classicForm: isEmpty(formData.userSession),
		...formData
	};
	const formProps = {
		readOnlyOption,
		renderStyle,
		variableGap,
		formDispatch
	};
	return (
		<div className={wrapperClassName}>
			{mapWithIndex(
				renderSectionFactory(fields, variablesLayout, gFormData, formProps),
				sections
			)}
		</div>
	);
};

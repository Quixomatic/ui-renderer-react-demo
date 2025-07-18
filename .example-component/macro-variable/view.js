import { cloneDeep } from 'lodash';
import '@servicenow/now-label-value';
import '@servicenow/now-loader';
import { t } from 'sn-translate';
import { isAttrTrue, getFieldAnnotation } from '../utils';

const getTemplates = async function() {
	let e = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : [];
	if (0 !== e.length)
		return t && await o,
		await _t(e.map(f)),
		e.reduce(((e,t)=>(e[t] = a.get(t),
		e)), {})
};

export const view = (
	{
		properties: {
			field: { label, visible, macroponentId },
			formData
		},
		properties
	},
	{ updateProperties }
) => {
	if (macroponentId && !properties.downloaded) {
		getTemplates([macroponentId]).then(fragmentGenerators => {
			if (fragmentGenerators[macroponentId]) {
				updateProperties({
					downloaded: true
				});
			}
		});
		return (
			<div className="sc-macro-variable-loader">
				<now-loader label={t('Loading...')} size="lg" />
			</div>
		);
	} else {
		// eslint-disable-next-line no-unused-vars
		let ComponentTag = 'macroponent-' + macroponentId;
		let componentProps = {
			field: cloneDeep(properties.field),
			formData : cloneDeep(formData)
		};
		if (isAttrTrue(visible) && macroponentId) {
			return (
				<div className="sc-macro-variable">
					{label ? (
						<sn-record-control-wrapper
							label={label}
							helperContent={getFieldAnnotation(properties.field)}
						/>
					) : (
						''
					)}
					<ComponentTag {...componentProps} />
				</div>
			);
		}
	}
};

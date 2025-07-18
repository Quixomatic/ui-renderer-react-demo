import { createCustomElement } from '@servicenow/ui-core';
import { snabbdom } from '@servicenow/ui-renderer-snabbdom';
import styles from './styles.scss';

export const view = ({ properties }) => {
	let { caption } = properties;
	return (
		<section className="sc-section">
			<div className="sc-section-body">
				{caption}
				<div className="sc-section-form-row">
					<slot />
				</div>
			</div>
		</section>
	);
};

createCustomElement('sn-catalog-form-variable-section', {
	renderer: { type: snabbdom },
	view,
	properties: {
		caption: {
			default: ''
		},
		parent: {
			default: '',
			reflect: true
		}
	},
	styles
});

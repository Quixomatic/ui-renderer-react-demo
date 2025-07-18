import '@servicenow/now-rich-text';
import { isAttrTrue } from '../utils';

export const view = ({ properties }) => {
	let {
		field: { label, visible }
	} = properties;
	if (isAttrTrue(visible)) {
		return (
			<div>
				<now-collapse expanded>
					<now-rich-text html={label} />
				</now-collapse>
			</div>
		);
	}
};

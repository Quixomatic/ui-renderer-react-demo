import {ACTION_COMPONENT} from './actions';
import {Fragment} from '@servicenow/ui-renderer-snabbdom';

import './confirmation-modal';

export default ({model, action, key, displayConfirmation}) => {
	const {actionType, actionComponent, actionAttributes} = action || {};

	const isUIComponent = actionType === ACTION_COMPONENT;
	const ActionComponent = actionComponent;
	const props = {
		...model,
		...actionAttributes
	};

	return (
		<Fragment>
			<slot />
			{!displayConfirmation && isUIComponent && ActionComponent ? (
				<ActionComponent hoist key={key} {...props} model={model} />
			) : null}
			{displayConfirmation ? (
				<sn-declarative-confirmation-modal
					action={action}
					show={displayConfirmation}
					hoist
				/>
			) : null}
		</Fragment>
	);
};

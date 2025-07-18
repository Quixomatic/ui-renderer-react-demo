import {t} from 'sn-translate';
import Modal from '../../modal-wrapper';

const createButtons = action => [
	{
		variant: 'primary-negative',
		label: action.label || t('Confirm')
	},
	{
		variant: 'secondary',
		label: t('Cancel')
	}
];

export default ({properties: {show, action, componentId}}) => {
	if (!action) return null;

	const buttons = createButtons(action);
	const message = action.confirmationMessage ? action.confirmationMessage : t('Execute action');

	return (
		<Modal
			component-id={`${componentId}_confirmation_modal`}
			opened={show}
			header-label={t('Confirmation')}
			footer-actions={buttons}>
			<p>{message}</p>
		</Modal>
	);
};

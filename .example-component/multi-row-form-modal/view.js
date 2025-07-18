import { t } from 'sn-translate';
import _ from 'lodash';
import '@servicenow/now-alert';
import '../sn-catalog-form';

function renderFormOverlay(localizedMessage = t('Please wait...')) {
	return (
		<div className="multi-row-modal--overlay-loading">
			<now-icon icon="loader-outline" size="lg" spin />
			<span>{localizedMessage}</span>
		</div>
	);
}

function renderForm(fields, layout, notifications, formData) {
	return (
		<div className="modal-content">
			<now-alert-list items={notifications} />
			<sn-catalog-form
				fields={fields}
				variablesLayout={layout}
				updated={new Date()}
				noGutter={true}
				formData={formData}
			/>
		</div>
	);
}

export default state => {
	let {
		isLoading,
		fields,
		variablesLayout,
		properties,
		notifications,
		formData = {}
	} = state;

	const { active, action } = properties;

	let modalLabel = action === 'add' ? t('Add') : t('Preview');

	let primaryButtonLabel = action === 'add' ? t('Add') : t('Update');
	const secondaryButtonLabel = t('Cancel');
	let footerActions = `[
		{
			"variant": "primary",
			"label": "${primaryButtonLabel}",
			"clickActionType": "MODAL_SUBMIT_CLICKED"
		},
		{
			"variant": "secondary",
			"label": "${secondaryButtonLabel}",
			"clickActionType": "MODAL_CLOSE_CLICKED"
		}
	]`;
	let clonedFields = _.cloneDeep(fields);
	return (
		<now-modal
			opened={active}
			size="lg"
			manageOpened={true}
			header-label={modalLabel}
			footer-actions={footerActions}
		>
			<slot name="content">
				{isLoading
					? renderFormOverlay(t('Loading...'))
					: renderForm(clonedFields, variablesLayout, notifications, formData)}
			</slot>
		</now-modal>
	);
};

import './preview/stepper3';
import '@devsnc/sn-record-input-connected';
import '@servicenow/now-alert';
import '@servicenow/now-button';
import '@servicenow/now-checkbox';
import '@servicenow/now-dropdown';
import '@servicenow/now-heading';
import '@servicenow/now-loader';
import '@servicenow/now-progress-bar';
import '@servicenow/now-radio-buttons';
import '@servicenow/now-stepper';
import '@servicenow/now-template-card';
import get from 'lodash/get';
import {t} from 'sn-translate';
import {getProperty} from 'sn-uxpage-presource';

import {
	EXPORTING,
	IMPORT_FOOTER_BUTTON,
	IMPORT_MODAL,
	IMPORT_MODAL_ACTIONS,
	LIST_IMPORT_PROPERTIES,
	NOW_MODAL,
	SIZE_FULL_SCREEEN,
	SIZE_LARGE,
	SIZE_MEDIUM,
	STEPPER_PROGRESS_STATES
} from '../../../constants';

import {
	LIST_IMPORT_CREATE_EXCEL,
	LIST_IMPORT_FILE_TITLE,
	LIST_IMPORT_INCLUDE_FIELDS
} from './listImportService';

export const updateRadioOptions = (radioOptions, key) => {
	return radioOptions.map(obj => {
		return {
			...obj,
			checked: key === obj.id
		};
	});
};

export const getModalSize = currentStep => {
	switch (currentStep) {
		case 1:
			return SIZE_LARGE;
		case 2:
			return SIZE_MEDIUM;
		case 3:
			return SIZE_FULL_SCREEEN;
		default:
			return SIZE_LARGE;
	}
};

export const getImportModalTitle = ({properties, showLoader, currentStep}) => {
	if (currentStep === 3) return IMPORT_MODAL.PREVIEW;
	const {table} = properties;
	return showLoader ? EXPORTING : t('Import external data into {0}', table);
};

export const renderNotifications = state => {
	const {notifications} = state;
	return notifications.length > 0 ? (
		<div className="sn-import-modal--alerts-container">
			<div className="sn-import-modal--alerts">
				<now-alert-list items={notifications} manageItems={true} />
			</div>
		</div>
	) : null;
};

export const getImportModalContent = (state, dispatch) => {
	const {currentStep, stepperItems, showLoader, previewLoader} = state;
	const renderLoader = showLoader || previewLoader;
	const className = renderLoader
		? 'import-modal-content-preview'
		: 'import-modal-content';
	return (
		<div className={`${className} height-100-percent`}>
			{renderLoader ? (
				<now-loader className="import-loader" size="lg" />
			) : (
				<div className="height-100-percent">
					{renderNotifications(state)}
					<now-stepper
						className="preview-modal-height"
						items={stepperItems}
						selected-item={currentStep}
						manage-selected-item
					/>
					{renderImportModalContent(state, currentStep, dispatch)}
				</div>
			)}
		</div>
	);
};

export const renderTemplateDropdown = state => {
	const {fields, dropDownOptions} = state;
	const getTemplateProp = getProperty(
		LIST_IMPORT_PROPERTIES.LEGACY_EXCEL_SUPPORT,
		false
	);
	return getTemplateProp === true || getTemplateProp === 'true' ? (
		<div className="template-dropdown">
			<label className="excel-template-label">
				{IMPORT_MODAL.EXCEL_TEMPLATE_FORMAT}
			</label>
			<now-dropdown
				items={dropDownOptions}
				selected-items={[fields.LIST_IMPORT_EXCEL_FORMAT.value]}
				select="none"
				variant="tertiary"
				size="sm"
				search="none"
				panelFitProps={{
					constrain: {minWidth: 'target', maxWidth: 200}
				}}></now-dropdown>
		</div>
	) : null;
};

export const renderImportModalContent = (state, currentStep, dispatch) => {
	return currentStep === 1
		? getImportModalStepper1Content(state)
		: currentStep === 2
		? getImportModalStepper2Content(state, dispatch)
		: currentStep === 3
		? getImportModalStepper3Content(state)
		: null;
};

export const uploadFile = (dispatch, file) => {
	dispatch(IMPORT_MODAL_ACTIONS.IMPORT_FILE_UPLOAD, {
		file
	});
};

export const updateStepperProgress = (stepperItems, step, stepperState) => {
	return stepperItems.map(obj => {
		return {
			...obj,
			progress: obj.id === step ? stepperState : obj.progress
		};
	});
};

export const browseButtonEffect = host => {
	// click the hidden input file to open browse window.
	if (host) {
		const modal = host.shadowRoot.querySelector(NOW_MODAL);
		if (modal) modal.querySelector('#fileInput_import').click();
	}
};

const getBrowseContent = state => {
	const {
		uploadFile: {file}
	} = state;
	return (
		<sn-record-input-connected
			label={LIST_IMPORT_FILE_TITLE}
			initialValue={file.name}
			readonly
		/>
	);
};

const getFileUploadOrProgressContent = state => {
	const {
		uploadFile: {file},
		showBrowse,
		showProgress
	} = state;
	if (!showBrowse && file) {
		return showProgress
			? getUploadProgressContent(state)
			: getBrowseContent(state);
	}
	return null;
};

const getBrowseMsgDivContent = msg => {
	return <div className="import-heading color-tertiary">{msg}</div>;
};

const getProgressOrUploadDivContent = msg => {
	return (
		<now-heading
			className="import-spacing-xxl"
			label={msg}
			variant="title-primary"
		/>
	);
};

const getUploadOrBrowseOrProgressMsg = state => {
	const {
		showBrowse,
		uploadFile: {file},
		showProgress
	} = state;
	if (showBrowse) {
		return getBrowseMsgDivContent(IMPORT_MODAL.BROWSE_MSG);
	} else if (file && !showBrowse) {
		//if the upload is clicked
		const progressOrUploadMsg = showProgress
			? IMPORT_MODAL.UPLOAD_PROGRESS
			: IMPORT_MODAL.UPLOAD_MSG;
		return getProgressOrUploadDivContent(progressOrUploadMsg);
	}
	return null;
};

export const getImportModalStepper2Content = (state, dispatch) => {
	return (
		<div
			className={`import-modal-content-2 ${state.showBrowse &&
				'content-center'}`}
			slot="content">
			{getUploadOrBrowseOrProgressMsg(state)}

			<div className="import-spacing-xxl">
				<input
					id="fileInput_import"
					accept=".xls,.xlsx,.XLS,.XLSX"
					on-change={e => uploadFile(dispatch, e.target.files[0])}
					className="now-a11y-label"
					type="file"
					tabIndex="-1"
					aria-hidden="true"
				/>
				{getFileUploadOrProgressContent(state)}
			</div>
		</div>
	);
};

export const getImportModalStepper3Content = state => {
	const {importSetId} = state;
	return (
		<div className="preview-modal-container">
			<sn-record-list-modal-import-preview import-set-id={importSetId} />
		</div>
	);
};

const getUploadProgressContent = state => {
	const {
		uploadFile: {progressPath, progressValue, file}
	} = state;
	return (
		<div className="import-progress">
			<now-template-card-attachment
				heading={{label: file.name}}
				identifier={{
					type: 'icon',
					icon: 'document-excel-fill'
				}}></now-template-card-attachment>
			<now-progress-bar
				pathType={progressPath}
				size="xs"
				value={progressValue}
			/>
		</div>
	);
};

export const getImportModalStepper1Content = state => {
	const {fields, insertUpdateRadioOptions} = state;
	return (
		<div className="import-spacing-xxl" slot="content">
			<now-heading
				label={IMPORT_MODAL.INSERT_UPDATE_MSG}
				variant="title-primary"
			/>
			<div className="import-spacing-md">
				<now-radio-buttons
					manageValue
					options={insertUpdateRadioOptions}></now-radio-buttons>
			</div>
			<div className="import-spacing-top-lg">
				<now-checkbox
					append-to-payload={{name: LIST_IMPORT_CREATE_EXCEL}}
					label={IMPORT_MODAL.EXCEL_TEMPLATE}
					checked={get(
						fields,
						'LIST_IMPORT_CREATE_EXCEL.value',
						true
					)}></now-checkbox>
				{get(fields, 'LIST_IMPORT_CREATE_EXCEL.value', true) ? (
					<div className="import-spacing-xs">
						{renderTemplateDropdown(state)}
						<now-checkbox
							append-to-payload={{name: LIST_IMPORT_INCLUDE_FIELDS}}
							label={IMPORT_MODAL.INCLUDE_ALL_FIELDS}
							checked={get(
								fields,
								'LIST_IMPORT_INCLUDE_FIELDS.value',
								true
							)}></now-checkbox>
						<br />
						<div className="import-spacing-sm-md">
							<now-button-bare
								label={IMPORT_MODAL.DOWNLOAD_TEMPLATE_LABEL}
								size="sm"></now-button-bare>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
};

const getStepper2UploadBrowseButton = (file, showBrowse) => {
	return file && !showBrowse
		? IMPORT_FOOTER_BUTTON.UPLOAD
		: IMPORT_FOOTER_BUTTON.BROWSE;
};

const getStepper2ProgressButtons = state => {
	const {
		uploadFile: {uploadSuccess}
	} = state;
	return uploadSuccess ? [] : [IMPORT_FOOTER_BUTTON.BACK];
};

const getExportCancelBtn = () => {
	return [
		{
			...IMPORT_FOOTER_BUTTON.CANCEL,
			clickActionType: IMPORT_MODAL_ACTIONS.EXPORT_CANCEL_CLICKED
		}
	];
};

const getStepper2BrowseButton = state => {
	const {
		uploadFile: {file},
		showBrowse
	} = state;
	return [
		getStepper2UploadBrowseButton(file, showBrowse),
		IMPORT_FOOTER_BUTTON.CANCEL,
		IMPORT_FOOTER_BUTTON.BACK
	];
};

const getStepper3Buttons = state => {
	const {previewLoader} = state;
	if (previewLoader) return [];
	return [
		IMPORT_FOOTER_BUTTON.COMPLETE_IMPORT,
		IMPORT_FOOTER_BUTTON.CANCEL,
		IMPORT_FOOTER_BUTTON.BACK
	];
};

export const getFooterActions = state => {
	const {currentStep, showProgress, showLoader} = state;
	if (currentStep === 1) {
		// export modal button
		if (showLoader) {
			return getExportCancelBtn();
		} else {
			return [IMPORT_FOOTER_BUTTON.NEXT, IMPORT_FOOTER_BUTTON.CANCEL];
		}
	} else if (currentStep === 2) {
		if (showProgress) {
			return getStepper2ProgressButtons(state);
		} else {
			return getStepper2BrowseButton(state);
		}
	} else if (currentStep === 3) {
		return getStepper3Buttons(state);
	}
};

export const updateStepperToInitialIfDone = (state, updateState) => {
	const {stepperItems, currentStep} = state;
	const curStepObj = stepperItems.find(ele => ele.id === currentStep);
	if (curStepObj && curStepObj.progress === STEPPER_PROGRESS_STATES.done) {
		const updatedItems = updateStepperProgress(
			stepperItems,
			currentStep,
			STEPPER_PROGRESS_STATES.none
		);
		updateState({
			path: 'stepperItems',
			value: updatedItems,
			operation: 'set'
		});
	}
};

export const intentType = {
	DATA_OPERATION: 'data_operation',
	DB_OPERATION: 'db_operation'
};

export const intentTarget = {
	FORM: 'form'
};

export const dataOperations = {
	GET_FIELD: 'GET_FIELD',
	SET_FIELD_VALUE: 'SET_FIELD_VALUE',
	EXECUTE_ACTION: 'EXECUTE_ACTION',
	EXECUTE_UI_ACTION: 'EXECUTE_UI_ACTION',
	SAVE_FORM: 'SAVE_FORM',
	CLOSE_OPENED_MODAL: 'CLOSE_OPENED_MODAL',
	GET_ACTION_STATE: 'GET_ACTION_STATE'
};

export const recordControllerOperations = {
	[dataOperations.SET_FIELD_VALUE]: 'CTRL_RECORD#SET_FIELD_VALUE',
	[dataOperations.EXECUTE_UI_ACTION]: 'CTRL_RECORD#EXECUTE_UI_ACTION',
	[dataOperations.SAVE_FORM]: 'CTRL_RECORD#SAVE_FORM',
	[dataOperations.CLOSE_OPENED_MODAL]: 'CTRL_RECORD#CLOSE_OPENED_MODAL'
};

export const gFormOperations = {
	[dataOperations.SET_FIELD_VALUE]: 'SET_VALUE',
	[dataOperations.EXECUTE_UI_ACTION]: 'EXECUTE_UI_ACTION',
	[dataOperations.SAVE_FORM]: 'SAVE',
	[dataOperations.CLOSE_OPENED_MODAL]: 'CLOSE_OPENED_MODAL'
};

export const recordControllerActions = {
	FORM_SUBMIT_COMPLETED: 'CTRL_RECORD#FORM_SUBMIT_COMPLETED'
};

export const gFormDataBrokerActions = {
	FORM_SUBMIT_COMPLETED: 'SN_FORM_DATA_CONNECTED#FORM_SUBMIT_COMPLETED'
};

export const feedbackStatus = {
	SUCCESS: 'success',
	ERROR: 'error',
	WARN: 'warn'
};

export const ACTION_BAR_TRIGGER_ACTION_KEY = 'TRIGGER_ACTION';
export const ACTION_BAR_GET_ACTION_STATE_KEY = 'GET_ACTION_STATE';

export const ACTION_BAR_TAG_NAME = 'now-record-common-uiactionbar';

import {
	MODAL_SUBMIT_CLICKED,
	MODAL_CLOSED,
	MODAL_CLOSE_CLICKED,
	PLATFORM_RESOURCES_LOADED,
	ENVIRONMENT_INITIALIZED,
	CATALOG_FORM_DATA_LOADED,
	CATALOG_FORM_DATA_LOAD_FAILED,
	MULTI_ROW_FORM_MODAL_CLOSED,
	NOW_ALERT_ITEM_CLICKED
} from './constants';
import {
	CATALOG_FORM_UI_MESSAGE_SET,
	CATALOG_FORM_UI_MESSAGES_CLEARED,
	CATALOG_FORM_CHANGED,
	CATALOG_FORM_FIELD_PROP_CHANGED,
	CATALOG_FORM_SUBMITTED
} from '../library-catalog-form/actions';

export const formEnvironmentActions = {
	[PLATFORM_RESOURCES_LOADED]: {
		private: true
	},
	[CATALOG_FORM_DATA_LOADED]: {
		private: true
	},
	[CATALOG_FORM_DATA_LOAD_FAILED]: {
		private: true
	},
	[ENVIRONMENT_INITIALIZED]: {
		private: true
	},
	[CATALOG_FORM_UI_MESSAGE_SET]: {
		private: true
	},
	[CATALOG_FORM_CHANGED]: {
		private: true
	},
	[CATALOG_FORM_UI_MESSAGES_CLEARED]: {
		private: true
	},
	[NOW_ALERT_ITEM_CLICKED]: {
		private: true
	},
	[CATALOG_FORM_FIELD_PROP_CHANGED]: {
		private: true
	},
	[CATALOG_FORM_SUBMITTED]: {
		private: true
	}
};

export const modalActions = {
	[MODAL_SUBMIT_CLICKED]: {
		private: true
	},
	[MODAL_CLOSE_CLICKED]: {
		private: true
	},
	[MODAL_CLOSED]: {
		private: true
	},
	[MULTI_ROW_FORM_MODAL_CLOSED]: {
		private: false
	}
};

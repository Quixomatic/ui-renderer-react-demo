import { snHttpFactory } from 'sn-http-request';
import { getGCKFromGlobal, getFormEnvironmentGlobals } from '../utils';
import { CatalogFormEnvironment } from '../CatalogFormEnvironment';
import { glideRecordFactory } from '../GlideRecord';
import {
	CATALOG_FORM_INITIALIZE_SUCCESS,
	CATALOG_FORM_INITIALIZE_FAILED
} from '../constants';
import { initializeFormData } from './initializeFormData';

function getHttpClient() {
	return snHttpFactory({
		xsrfToken: getGCKFromGlobal(),
		batching: false
	});
}

function initCatalogFormEnvironment(
	{
		glideFormEnvironmentFactory,
		glideFormFactory,
		glideAjax,
		glideModalFactory,
		glideUser,
		uiScriptFactory
	},
	formData,
	sendRequest,
	dispatch,
	environmentOptions
) {
	//TODO: Init Client side GR
	const glideRecord = glideRecordFactory({ sendRequest });
	const env = new CatalogFormEnvironment(
		formData,
		{
			glideFormEnvironmentFactory,
			glideFormFactory,
			glideAjax,
			glideRecord,
			glideModalFactory,
			glideUser,
			uiScriptFactory
		},
		dispatch,
		environmentOptions
	);
	env.initialize();
	return env;
}

function* initializeFormEnvironment(options = {}, { action, dispatch }) {
	let {
		dataParam,
		successActionType = CATALOG_FORM_INITIALIZE_SUCCESS,
		errorActionType = CATALOG_FORM_INITIALIZE_FAILED,
		headers,
		isMultiRowVariable = false
	} = options;
	try {
		let data = action.payload[dataParam];
		const sendRequest = getHttpClient();
		const formData = yield* initializeFormData(data, {
			headers,
			httpClient: sendRequest
		});

		const { globals = getFormEnvironmentGlobals() } = options;

		let gEnv = initCatalogFormEnvironment(
			globals,
			formData,
			sendRequest,
			dispatch,
			{
				isMultiRowVariable
			}
		);

		dispatch(successActionType, {
			gForm: gEnv.getFormController(),
			fields: gEnv.getFormFields(),
			variablesLayout: gEnv.getVariablesLayout()
		});
	} catch (error) {
		dispatch(errorActionType, { error });
	}
}

export function createInitializeCatalogFormEnvironmentEffect(options) {
	return {
		effect: initializeFormEnvironment,
		args: [options]
	};
}

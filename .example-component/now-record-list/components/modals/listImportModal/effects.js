import {createHttpEffect} from '@servicenow/ui-effect-http';

import {IMPORT_MODAL_ACTIONS} from '../../../constants';

export const getProgressStatusEffect = createHttpEffect(
	'/api/now/importprogresschecker/getStatus',
	{
		method: 'POST',
		batch: false,
		queryParams: ['sysparm_execution_id'],
		successActionType: IMPORT_MODAL_ACTIONS.PROGRESS_STATUS_SUCCEEDED,
		errorActionType: IMPORT_MODAL_ACTIONS.PROGRESS_STATUS_FAILED
	}
);

export const createFileUploaderEffect = createHttpEffect(
	'sys_import_template.do',
	{
		method: 'POST',
		batch: false,
		queryParams: [
			'sysparm_process_stage',
			'sysparm_query',
			'sysparm_rows',
			'sysparm_view',
			'sysparm_template_type',
			'sysparm_parent_tracker_id',
			'attachFile',
			'sysparm_workspace_import'
		],
		successActionType: IMPORT_MODAL_ACTIONS.FILE_UPLOAD_PROCESSOR_SUCCEEDED,
		errorActionType: IMPORT_MODAL_ACTIONS.FILE_UPLOAD_PROCESSOR_FAILED
	}
);

export const createCompleteImportEffect = createHttpEffect(
	'sys_import_template.do',
	{
		method: 'POST',
		batch: false,
		queryParams: [
			'sysparm_target',
			'sysparm_process_stage',
			'sysparm_import_set_id',
			'sysparm_view',
			'sysparm_template_type',
			'sysparm_workspace_import'
		],
		successActionType: IMPORT_MODAL_ACTIONS.LIST_IMPORT_COMPLETE_SUCCEEDED,
		errorActionType: IMPORT_MODAL_ACTIONS.LIST_IMPORT_COMPLETE_FAILED
	}
);

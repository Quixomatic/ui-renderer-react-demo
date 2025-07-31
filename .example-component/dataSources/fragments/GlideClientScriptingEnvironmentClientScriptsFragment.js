import {createVariableString} from './fragmentUtils';
import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL} from './channelConstants';
import {glideClientScriptingEnvironmentClientScriptsFragmentResponseHandler} from './responseHandlers/glideClientScriptingEnvironmentClientScriptsFragmentResponseHandler';
import { CATALOG_CLIENT_SCRIPTING_ENVIRONMENT_SCRIPTS_FRAGMENT_PREFIX } from './queryConstants';

const GlideClientScriptingEnvironmentClientScriptsFragment = createQueryFragment(
	{
		prefix: CATALOG_CLIENT_SCRIPTING_ENVIRONMENT_SCRIPTS_FRAGMENT_PREFIX,
		variables: [
			{
				name: 'table',
				mandatory: true,
				type: 'String',
				mapTo: 'table'
			},
			{
				name: 'sysId',
				mandatory: true,
				type: 'String',
				mapTo: 'sysId'
			}
		],
		// eslint-disable-next-line no-unused-vars
		queryTemplate: (children = [], variables = []) => {
			return `
			${CATALOG_CLIENT_SCRIPTING_ENVIRONMENT_SCRIPTS_FRAGMENT_PREFIX}${createVariableString(variables)} {
				onLoad {
					name
					sysId
					script
					type
					fieldName
					tableName
				}
				onChange {
					name
					sysId
					script
					type
					fieldName
					tableName
				}
				onSubmit {
					name
					sysId
					script
					type
					fieldName
					tableName
				}
				messages {
					name
					value
				}
			}
		`;
		},
		responseHandler: glideClientScriptingEnvironmentClientScriptsFragmentResponseHandler,
		channels: [GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CLIENT_SCRIPTS_CHANNEL]
	}
);
export default GlideClientScriptingEnvironmentClientScriptsFragment;

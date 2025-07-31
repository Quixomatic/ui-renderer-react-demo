import {createVariableString} from './fragmentUtils';
import {GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL} from './channelConstants';
import { glideClientScriptingEnvironmentUIPolicyFragmentResponseHanlder } from './responseHandlers/glideClientScriptingEnvironmentUIPolicyFragmentResponseHanlder';
import {CATALOG_CLIENT_SCRIPTING_ENVIRONMENT_POLICIES_FRAGMENT_PREFIX} from './queryConstants';
import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
const GlideClientScriptingEnvironmentUIPolicyFragment = createQueryFragment({
	prefix: CATALOG_CLIENT_SCRIPTING_ENVIRONMENT_POLICIES_FRAGMENT_PREFIX,
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
            ${CATALOG_CLIENT_SCRIPTING_ENVIRONMENT_POLICIES_FRAGMENT_PREFIX}${createVariableString(variables)} {
                shortDescription
				sysId
				scriptTrue {
					name
					script
				}
				scriptFalse {
					name
					script
				}
				reverse
				onLoad
				isRunScripts
				preEvaluated
				preEvaluatedResult
				actions {
					visible
					name
					disabled
					mandatory
					cleared: clearValue
					relatedList
					value
					valueAction
					fieldMessageType
					fieldMessage
					sysId
				}
				conditions {
					term
					field: fieldName
					fieldLabel
					type
					columnType
					value
					oper: operator
					operatorLabel
					catalogVariable
					catalogOperator
					catalogVariableType
					catalogVariableTable
					or: isOrQuery
					newquery: isNewQuery
					preEvaluatedTerm
					preEvaluatedTermResult
					referenceFields {
						table
						fieldName
						fieldLabel
						internalType
						referenceTable
					}
				}
            }
		`;
	},
	responseHandler: glideClientScriptingEnvironmentUIPolicyFragmentResponseHanlder,
	channels: [GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_UI_POLICY_CHANNEL]
});
export default GlideClientScriptingEnvironmentUIPolicyFragment;

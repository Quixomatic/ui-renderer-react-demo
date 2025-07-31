import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CHANNEL} from './channelConstants';
import {GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_PREFIX} from './queryConstants';
import {glideClientScriptingEnvironmentFragmentResponseHandler} from './responseHandlers/glideClientScriptingEnvironmentFragmentResponseHandler';
import GlideClientScriptingEnvironmentClientScriptsFragment from './GlideClientScriptingEnvironmentClientScriptsFragment';
import GlideClientScriptingEnvironmentUIPolicyFragment from './GlideClientScriptingEnvironmentUIPolicyFragment';

const GlideClientScriptingEnvironmentFragment = createQueryFragment({
	prefix: GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_PREFIX,
	variables: [],
	queryTemplate: (children = []) => {
		return `
				${GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_PREFIX} {
                    ${children.join('\n')}
                }
            `;
	},
	responseHandler: glideClientScriptingEnvironmentFragmentResponseHandler,
	channels: [GLIDE_CLIENT_SCRIPTING_ENVIRONMENT_CHANNEL],
	children: [
		GlideClientScriptingEnvironmentClientScriptsFragment,
		GlideClientScriptingEnvironmentUIPolicyFragment
	]
});
export default GlideClientScriptingEnvironmentFragment;

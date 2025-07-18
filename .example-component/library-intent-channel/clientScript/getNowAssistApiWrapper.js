import {requestConversationWithSkill} from '../core';

export const getNowAssistApiWrapper = (macroponentProperties) =>
	new Proxy(
		{},
		{
			get(_, apiName) {
				if (apiName === 'requestConversationWithSkill') {
					return (...fnArguments) => {
						const {nowId} = macroponentProperties;
						if (!nowId) throw new Error(`Unable to find translator key`);
						requestConversationWithSkill.apply(null, [nowId, ...fnArguments]);
					};
				}
			}
		}
	);

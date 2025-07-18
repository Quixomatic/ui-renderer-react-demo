let actionBarsByTranslatorId = {};

export const addActionBarForTranslator = (translatorId, actionBarId, props) => {
	if (!props.actionNodes) return;
	if (!actionBarsByTranslatorId[translatorId])
		actionBarsByTranslatorId[translatorId] = {};
	actionBarsByTranslatorId[translatorId][actionBarId] = props.daModel;
};

export const getActionbarsForTranslator = (translatorId, context) => {
	const bars = actionBarsByTranslatorId[translatorId] || {};
	let comparingContext = {...context};
	if (context.sysId === '-1') {
		delete comparingContext.sysId;
		comparingContext.isNewRecord = true;
	}
	return Object.keys(bars).filter((nowId) => {
		const barContext = bars[nowId];
		return Object.keys(comparingContext).every(
			(key) => comparingContext[key] === barContext[key]
		);
	});
};

export const deleteActionBarsForTranslator = (translatorId) =>
	delete actionBarsByTranslatorId[translatorId];

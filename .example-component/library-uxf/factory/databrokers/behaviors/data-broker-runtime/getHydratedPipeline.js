import resolveForDbExecEngine from '../../../UxValueResolver/resolveForDbExecEngine';

export default (
	pipeline,
	seismicProperties,
	seismicState,
	csdbNodeId,
	pdbNodeIds,
	externalControllerDependencies = []
) => {
	return pipeline.map((db) => {
		// todo: look at the input schema of this DB and validate args object before sending out the request
		const {
			type,
			definitionSysId,
			definitionAttributes,
			inputValues,
			headers = null,
			cachePolicy = null
		} = db;
		return {
			type,
			definitionSysId,
			...(definitionAttributes ? {definitionAttributes} : {}),
			inputValues: resolveForDbExecEngine(
				seismicProperties,
				seismicState,
				inputValues,
				csdbNodeId,
				pdbNodeIds,
				externalControllerDependencies
			),
			...(type === 'REST_EXTERNAL' ? {headers, cachePolicy} : {})
		};
	});
};

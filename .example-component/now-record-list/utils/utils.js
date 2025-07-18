export const isEmpty = value => {
	const isUndefined = value === undefined;
	const isNull = value === null;
	const isEmptyObject = typeof value === 'object' && !Object.keys(value).length;
	const isEmptyString = typeof value === 'string' && !value.trim().length;

	return isUndefined || isNull || isEmptyObject || isEmptyString;
};

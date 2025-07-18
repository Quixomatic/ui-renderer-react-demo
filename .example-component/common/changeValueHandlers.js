export const createOnValueChangeHandler = (actionName, dispatch) => (
	event,
	fieldName,
	value,
	displayValue,
	error
) => dispatch(actionName, { value, displayValue, error });

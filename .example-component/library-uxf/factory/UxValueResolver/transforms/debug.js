/* eslint no-console: 0 */

export const debug = (operands) => {
	if (operands.length < 2) {
		return null;
	}
	let message;
	if (typeof operands[0] === 'object' && operands[0].value) {
		message = operands[0].value;
	}
	if (typeof operands[0] === 'string') {
		message = operands[0];
	}
	console.group('[UXValue Resolver]');
	console.log(`Message: ${message}`);
	console.log('Value', operands[1]);
	console.groupEnd();

	return operands[1];
};

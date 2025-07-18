export default (operator, left, right) => {
	switch (operator) {
		case 'ADD':
			return left + right;
		case 'SUB':
			return left - right;
		case 'MULTIPLY':
			return left * right;
		case 'DIVIDE':
			return left / right;
		case 'MOD':
			return left % right;
		case '>':
			return left > right;
		case '<':
			return left < right;
		case '>=':
			return left >= right;
		case '<=':
			return left <= right;
		case 'EQUAL':
			return left == right;
		case 'NOT_EQUAL':
			return left != right;
		case 'AND':
			return left && right;
		case 'OR':
			return left || right;
		case '??':
			return left ?? right;
	}
};

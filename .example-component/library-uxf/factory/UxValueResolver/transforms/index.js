import resolveConcat from './concat';
import resolveIf from './if';
import resolveEmpty from './empty';
import resolveLen from './len';
import resolvePick from './pick';
import resolveRange from './range';
import resolveSum from './sum';
import resolveAny from './any';
import resolveAll from './all';
import resolveWhere from './where';
import indexof from './indexof';
import lastindexof from './lastindexof';
import slice from './slice';
import {stringify, parse} from './json';
import includes from './includes';
import {replace, replaceAll, trim, uppercase, lowercase} from './strings';
import {keys, values, entries, withCT} from './objects';
import {debug} from './debug';
import get from './get';

export default (operator, operands) => {
	if (!Array.isArray(operands)) {
		return null;
	}
	switch (operator) {
		case 'CONCAT':
			return resolveConcat(operands);
		case 'IF':
			return resolveIf(operands);
		case 'EMPTY':
			return resolveEmpty(operands);
		case 'LEN':
			return resolveLen(operands);
		case 'PICK':
			return resolvePick(operands);
		case 'RANGE':
			return resolveRange(operands);
		case 'SUM':
			return resolveSum(operands);
		case 'ANY_EQ':
			return resolveAny('EQ', operands);
		case 'ANY_NEQ':
			return resolveAny('NEQ', operands);
		case 'ANY_GT':
			return resolveAny('GT', operands);
		case 'ANY_GTE':
			return resolveAny('GTE', operands);
		case 'ANY_LT':
			return resolveAny('LT', operands);
		case 'ANY_LTE':
			return resolveAny('LTE', operands);
		case 'ANY_EMPTY':
			return resolveAny('EMPTY', operands);
		case 'ANY_NOTEMPTY':
			return resolveAny('NOTEMPTY', operands);
		case 'ANY_ONEOF':
			return resolveAny('ONEOF', operands);
		case 'ANY_NOTONEOF':
			return resolveAny('NOTONEOF', operands);
		case 'ALL_EQ':
			return resolveAll('EQ', operands);
		case 'ALL_NEQ':
			return resolveAll('NEQ', operands);
		case 'ALL_GT':
			return resolveAll('GT', operands);
		case 'ALL_GTE':
			return resolveAll('GTE', operands);
		case 'ALL_LT':
			return resolveAll('LT', operands);
		case 'ALL_LTE':
			return resolveAll('LTE', operands);
		case 'ALL_EMPTY':
			return resolveAll('EMPTY', operands);
		case 'ALL_NOTEMPTY':
			return resolveAll('NOTEMPTY', operands);
		case 'ALL_ONEOF':
			return resolveAll('ONEOF', operands);
		case 'ALL_NOTONEOF':
			return resolveAll('NOTONEOF', operands);
		case 'WHERE_EQ':
			return resolveWhere('EQ', operands);
		case 'WHERE_NEQ':
			return resolveWhere('NEQ', operands);
		case 'WHERE_GT':
			return resolveWhere('GT', operands);
		case 'WHERE_GTE':
			return resolveWhere('GTE', operands);
		case 'WHERE_LT':
			return resolveWhere('LT', operands);
		case 'WHERE_LTE':
			return resolveWhere('LTE', operands);
		case 'WHERE_EMPTY':
			return resolveWhere('EMPTY', operands);
		case 'WHERE_NOTEMPTY':
			return resolveWhere('NOTEMPTY', operands);
		case 'WHERE_ONEOF':
			return resolveWhere('ONEOF', operands);
		case 'WHERE_NOTONEOF':
			return resolveWhere('NOTONEOF', operands);
		case 'INDEXOF':
			return indexof(operands);
		case 'LASTINDEXOF':
			return lastindexof(operands);
		case 'SLICE':
			return slice(operands);
		case 'STRING':
			return stringify(operands);
		case 'PARSE':
			return parse(operands);
		case 'INCLUDES':
			return includes(operands);
		case 'REPLACE':
			return replace(operands);
		case 'REPLACEALL':
			return replaceAll(operands);
		case 'TRIM':
			return trim('both', operands);
		case 'TRIMSTART':
			return trim('start', operands);
		case 'TRIMEND':
			return trim('end', operands);
		case 'UPPERCASE':
			return uppercase(operands);
		case 'LOWERCASE':
			return lowercase(operands);
		case 'KEYS':
			return keys(operands);
		case 'VALUES':
			return values(operands);
		case 'ENTRIES':
			return entries(operands);
		case 'WITH':
			return withCT(operands);
		case 'DEBUG':
			return debug(operands);
		case 'GET':
			return get(operands);
		default:
			return null;
	}
};

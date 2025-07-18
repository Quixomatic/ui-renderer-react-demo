import _ from 'lodash';
export function escapeSeismicSpecialSymbols(s) {
	return _.startsWith(s, '@') ? `\\${s}` : s;
}

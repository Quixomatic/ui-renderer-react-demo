let v4 =
	'(0*)(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])(?:\\.(0*)(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])){3}';
let v6frag = '[0-9a-fA-F]{1,4}';

/**
 * validates if passed in string is a valid IP address (IPv4 or IPv6)
 * @param {string} address ip string we wish to test
 * @return {boolean} valid or not
 */
function isIPAddress(address) {
	return isIPV4Address(address) || isIPV6Address(address);
}

/**
 * validates if passed in string is a valid IP address (IPv4)
 * @param {string} address ip string we wish to test
 * @return {boolean} valid or not
 */
function isIPV4Address(address) {
	let reg = '^' + v4 + '$';
	let re = new RegExp(reg);
	return re.test(address);
}

/**
 * validates if passed in string is a valid IP address (IPv6)
 * @param {string} address ip string we wish to test
 * @return {boolean} valid or not
 */
function isIPV6Address(address) {
	let reg =
		'^((?:' +
		v6frag +
		':){7}(?:' +
		v6frag +
		'|:)|' +
		'(?:' +
		v6frag +
		':){6}(?:' +
		v4 +
		'|:' +
		v6frag +
		'|:)|' +
		'(?:' +
		v6frag +
		':){5}(?::' +
		v4 +
		'|(:' +
		v6frag +
		'){1,2}|:)|' +
		'(?:' +
		v6frag +
		':){4}(?:(:' +
		v6frag +
		'){0,1}:' +
		v4 +
		'|(:' +
		v6frag +
		'){1,3}|:)|' +
		'(?:' +
		v6frag +
		':){3}(?:(:' +
		v6frag +
		'){0,2}:' +
		v4 +
		'|(:' +
		v6frag +
		'){1,4}|:)|' +
		'(?:' +
		v6frag +
		':){2}(?:(:' +
		v6frag +
		'){0,3}:' +
		v4 +
		'|(:' +
		v6frag +
		'){1,5}|:)|' +
		'(?:' +
		v6frag +
		':){1}(?:(:' +
		v6frag +
		'){0,4}:' +
		v4 +
		'|(:' +
		v6frag +
		'){1,6}|:)|' +
		'(?::((?::' +
		v6frag +
		'){0,5}:' +
		v4 +
		'|(?::' +
		v6frag +
		'){1,7}|:)))(%[0-9a-zA-Z]{1,})?$';
	let re = new RegExp(reg);
	return re.test(address);
}

export { isIPAddress, isIPV4Address, isIPV6Address };

/**
 * validates if passed in string is a localhost
 * @param {string} value hostname string we wish to test
 * @return {boolean} valid or not
 */
function isLocalhost(value) {
	let re = /^(:|(0:){1,6}|(0:){6}0):1$/;
	return (
		value.toLowerCase() === 'localhost' ||
		value.toLowerCase() === '127.0.0.1' ||
		re.test(value)
	);
}

/**
 * validates if passed in string is a domain
 * @param {string} domain domain string we wish to test
 * @return {boolean} valid or not
 */
function isDomain(domain) {
	let re = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]*\.[a-zA-Z]{2,11}?$/;
	return re.test(domain);
}

/**
 * validates if passed in string is a hostname, namely localhost, or domain
 * @param {string} value hostname string we wish to test
 * @return {boolean} valid or not
 */
function isHostname(value) {
	return isLocalhost(value) || isDomain(value);
}

export { isLocalhost, isDomain, isHostname };

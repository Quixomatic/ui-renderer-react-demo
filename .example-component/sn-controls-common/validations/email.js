import { isHostname } from './hostname';
import { isIPAddress } from './ipaddress';

/**
 * validates that an email is valid format, namely valid recipient name(supports unicode) + @ + valid hostname or IP
 * @param {string} email email string we wish to test
 * @return {boolean} valid or not
 */
function isEmail(email) {
	let components = email.split('@');
	if (components.length != 2) return false;
	let re = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))$/i;
	return (
		re.test(components[0]) &&
		(isIPAddress(components[1]) || isHostname(components[1]))
	);
}

export { isEmail };

export function isValidUrl(url) {
	return hasValidHttp(url);
}

function hasValidHttp(url) {
	return /^$|^(https?|ftp):\/\/(www\.)?(([-\w@:%.\+~#=]{1,256}\.[a-z0-9()]{1,63})|(localhost))\b([-\w()@:%\+.~#?&//=]*)/i.test(
		url
	);
}

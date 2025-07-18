let snHttpRef;

const snHttp = async () => {
	if (snHttpRef) return snHttpRef;

	const {snHttpInstance} = await import('sn-http-request');
	snHttpRef = snHttpInstance;
	return snHttpInstance;
};

export default snHttp;

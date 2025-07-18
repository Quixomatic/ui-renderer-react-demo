export function importESModule(url) {
	const tempUrl = url.replace(/\.js()dbx$/, '');
	// allow cache buster injection into dymnamic urls
	return import(/* webpackIgnore: true */ `${tempUrl}.jsdbx`).catch((error) => {
		console.error(error);
	});
}

export function importNonModuleScript(scriptUrl) {
	return new Promise((resolve, reject) => {
		function cleanupEventListeners() {
			scriptEl.removeEventListener('load', cleanUpAndResolve);
			scriptEl.removeEventListener('error', cleanUpAndReject);
		}

		function cleanUpAndResolve() {
			cleanupEventListeners();
			resolve();
		}

		function cleanUpAndReject() {
			cleanupEventListeners();
			reject();
		}

		const scriptEl = document.createElement('script');
		scriptEl.type = 'text/javascript';
		scriptEl.src = scriptUrl;
		scriptEl.addEventListener('load', cleanUpAndResolve);
		scriptEl.addEventListener('error', cleanUpAndReject);
		document.head.appendChild(scriptEl);
	});
}

export default function importESModules(esmImports) {
	return esmImports
		.map(({moduleSpecifier}) => moduleSpecifier)
		.map(importESModule);
}

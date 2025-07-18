import {
	fetchClientCacheableContent,
	PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_ENABLED
} from './getClientCacheableContent.js';
import {importNonModuleScript} from './importESModules.js';

function getLoadedStaticPageFragmentsSysIds() {
	return Array.from(document.head.getElementsByTagName('script'))
		.map((scriptEl) => scriptEl.getAttribute('data-uxpf-sys-id'))
		.filter((macroponentSysId) => (macroponentSysId?.length ?? 0) > 0);
}

const LOADED_STATIC_PAGE_FRAGMENT_SYS_IDS = new Set(
	getLoadedStaticPageFragmentsSysIds()
);

function shouldSkipClientScriptRegistrations(pageFragment) {
	const {inline = false} = pageFragment;
	return inline;
}

function getStaticPageFragment(pageFragment) {
	const {
		__UXF_staticPageFragmentGetterRegistry: staticPageFragmentGetterRegistry
	} = window;

	if (!staticPageFragmentGetterRegistry) return pageFragment;

	const {sysId: macroponentSysId} = pageFragment;

	if (staticPageFragmentGetterRegistry.has(macroponentSysId)) {
		const staticPageFragmentGetterFn =
			staticPageFragmentGetterRegistry.get(macroponentSysId);
		staticPageFragmentGetterRegistry.delete(macroponentSysId);
		LOADED_STATIC_PAGE_FRAGMENT_SYS_IDS.delete(macroponentSysId);

		const skipClientScriptRegistrations =
			shouldSkipClientScriptRegistrations(pageFragment);
		const staticPageFragment = staticPageFragmentGetterFn(
			skipClientScriptRegistrations
		);

		staticPageFragment.clientScriptEsm = null; // since we load the client script inline

		return {...staticPageFragment, ...pageFragment};
	} else {
		return pageFragment;
	}
}

async function loadStaticPageFragmentScript(staticContentUrl) {
	try {
		await importNonModuleScript(staticContentUrl);
	} catch (e) {
		console.warn(`Failed to load static page fragment script`);
	}
}

export default async function getReconstructedPageFragment(pageFragment) {
	const {
		sysId: macroponentSysId,
		staticContentUrl = '',
		clientCacheableContentUrl = ''
	} = pageFragment;
	if (
		!LOADED_STATIC_PAGE_FRAGMENT_SYS_IDS.has(macroponentSysId) &&
		staticContentUrl?.length > 0
	) {
		await loadStaticPageFragmentScript(staticContentUrl);
	}

	const pageFragmentWithStaticFields = getStaticPageFragment(pageFragment);

	if (
		!PAGE_FRAGMENT_PARTIAL_CONTENT_CACHE_ENABLED ||
		clientCacheableContentUrl.length === 0
	)
		return pageFragmentWithStaticFields;

	const [clientCacheableContent] = await fetchClientCacheableContent(
		clientCacheableContentUrl
	);

	return {...clientCacheableContent, ...pageFragmentWithStaticFields};
}

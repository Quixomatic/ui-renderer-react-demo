/* prettier-ignore */
import {get} from '@devsnc/snowdash';
import {toLower} from '@devsnc/snowdash';
import snHttp from '../snHttpInstance/index.js';

const getDriverAssetByTagName = async (tagName) => {
	const resp = await snHttp.request(
		'/api/now/uxpage/driver_asset_scripts',
		'POST',
		{
			data: {tagName: tagName},
			batch: false
		}
	);
	const assetName = get(resp, ['data', 'result', 'name']);
	return assetName;
};

export async function NowUIDriverFactory(nowUIDOMElement) {
	let queryName = get(nowUIDOMElement, 'tagName');

	if (!(nowUIDOMElement instanceof HTMLElement)) {
		console.warn('Non-HTMLElement input provided to NowUIDriverFactory');
		return null;
	}

	queryName = toLower(queryName);

	//check if the driver is already loaded
	const driver = get(window, ['__COMPONENT_DRIVERS__', queryName]);
	if (driver) {
		return await driver(nowUIDOMElement);
	}

	// query the asset name by the tag name
	const driverName = await getDriverAssetByTagName(queryName);

	if (driverName) {
		//append bundle script
		const url = `/uxasset/externals/${driverName}.jsdbx`;
		try {
			await import(/*webpackIgnore: true*/ url);
		} catch (e) {
			console.warn(`Could not import driver ${url}`);
			return null;
		}

		//tectonic's createDriverAPI should trigger if the import succeeds and add the driver to the registry
		if (!window.__COMPONENT_DRIVERS__) {
			console.warn(
				"Component driver registry can't be found after driver import"
			);
			return null;
		}

		const driverFromReg = get(window, ['__COMPONENT_DRIVERS__', queryName]);
		if (driverFromReg) {
			return await driverFromReg(nowUIDOMElement);
		}
	} else {
		console.warn(
			`Driver asset name lookup failed for componentTag ${queryName}`
		);
		return null;
	}
}

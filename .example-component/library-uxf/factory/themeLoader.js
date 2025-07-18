import {escape} from '@devsnc/snowdash';
import {getUxGlobal} from '../templateLoader/utils.js';
import {has} from '@devsnc/snowdash';
import {default as console} from '../utils/getLogger.js';
import {UXF_THEME_UPDATED} from './constants.js';

export function normalizePropertyName(name) {
	// 1. assume unprefixed properties should be prefixed with "--now-"
	// 2. if values already have a "--" prefix, leave them alone
	if (!name.startsWith('--')) {
		return '--now-' + name;
	}
	return name;
}

function resolve(properties, value, visited = []) {
	if (visited.indexOf(value) !== -1) {
		const path = [...visited, value].join(' --> ');
		console.error(`Unable to resolve circular theme reference: ${path}`);
		return value;
	}
	if (has(properties, [value])) {
		return resolve(properties, properties[value], [...visited, value]);
	}
	return value;
}

export function resolveProperties(properties) {
	const normalized = {};
	for (const [name, value] of Object.entries(properties)) {
		normalized[normalizePropertyName(name)] = value;
	}
	const result = {};
	for (const [name, value] of Object.entries(normalized)) {
		result[name] = resolve(normalized, value);
	}
	return result;
}

export function printProperties(properties) {
	let result = '';
	for (const k of Object.keys(properties)) {
		const propName = normalizePropertyName(k);
		result += `\n${propName}:${properties[k]};`;
	}
	return result;
}

const BGCOLOR = '--now-color_background--primary';
const COLOR = '--now-color_text--primary';
export function printCssText(properties, cssSelector = ':root') {
	return `
${cssSelector} { ${printProperties(resolveProperties(properties))} \n}
html, body {
	background-color: RGB(var(${BGCOLOR}, 255, 255, 255));
	color: RGB(var(${COLOR}, 22, 27, 28));
}
`.trim();
}

function installFonts(fonts) {
	if (!Array.isArray(fonts)) {
		return;
	}
	const cssFontFaceDefinitions = fonts.reduce((acc, font) => {
		return acc.concat(getCssFontFaceDef(font));
	}, '');

	const styleEl = document.createElement('STYLE');
	styleEl.id = 'font-definitions';
	styleEl.textContent = cssFontFaceDefinitions;
	document.head.appendChild(styleEl);

	function getCssFontFaceDef({name, uri, properties}) {
		const fontDef = `
@font-face {
	font-family: "${escape(name)}";
	src: url('${uri}');
`;

		if (properties) {
			return Object.entries(properties)
				.reduce((fontDef, [property, value]) => {
					return fontDef.concat(`	${escape(property)} : ${escape(value)};\n`);
				}, fontDef)
				.concat('}');
		} else {
			return fontDef.concat('}');
		}
	}
}

function installImages(images) {
	const UxGlobalTheme = getUxGlobal('theme');
	if (UxGlobalTheme.assets) {
		UxGlobalTheme.assets.images = images;
	}

	if (images['favicon']) {
		const head = document.querySelector('head');
		const link = document.createElement('link');
		link.setAttribute('rel', 'shortcut icon');
		link.setAttribute('href', images.favicon.uri);
		head.appendChild(link);
	}
}

function getImageAssetsCssVars(imageAssets) {
	const cssVars = {};
	Object.entries(imageAssets).map(([name, {uri}]) => {
		cssVars[`--now-theme-image-${name}`] = `url('${uri}')`;
	});
	return cssVars;
}

function triageAssets(assets) {
	return assets.reduce(
		(triagedAssets, asset) => {
			if (asset.category == 'font') {
				triagedAssets.fonts.push(asset);
			} else if (asset.category == 'image') {
				if (asset.properties && asset.properties.position) {
					triagedAssets.images[asset.properties.position] = asset;
				}
			}
			return triagedAssets;
		},
		{
			images: {},
			fonts: []
		}
	);
}

// @TODO(david.leonard): These are old system theme properties that were
// renamed by NDS in Quebec, but some of them are still in the code for
// components that haven't rebuilt with a newer version of NDS SCSS. We can
// remove this in Rome when all internal component authors rebuild.
// Removing this should have no impact on external customers because we
// didn't ship theming to the public
// NOTE: This is the only place we should make theme values var(--foo) statements,
// normally this is an antipattern and they should be --foo statements to
// allow for resolving via JS without having to trigger a restyle by reading
// computed styles from the DOM.
const COMPAT_THEME_PROPS = getUxGlobal('compatThemeProps');

//These are the properties that UIB exposes via dropdowns to users.
//They are static and defined by NDS. They are not overridable.
// DEF0368896 - defined in glide/glide-ux-builder/src/main/java/com/glide/ux/runtime/page_processing/doc_gen/UxAppHTMLDocGenerator.java
const STATIC_THEME_PROPS = getUxGlobal('staticThemeProps');

function buildTheme({
	coreStyles = [],
	legacyTheme: {assets: legacyAssets = [], theme: legacyProperties = {}} = {},
	infoDensities = {},
	variants = {},
	userPreferenceInfoDensity = '',
	userPreferenceVariant = ''
}) {
	const allProperties = {};
	const allAssets = [];
	for (const {properties = {}, assets = []} of coreStyles) {
		Object.assign(allProperties, properties);
		allAssets.push(...assets);
	}

	Object.assign(allProperties, legacyProperties);
	allAssets.push(...legacyAssets);

	if (!infoDensities[userPreferenceInfoDensity]) {
		userPreferenceInfoDensity = 'default';
	}

	if (infoDensities[userPreferenceInfoDensity]) {
		const {properties: infoDensityProps = {}, assets: infoDensityAssets = []} =
			infoDensities[userPreferenceInfoDensity];

		Object.assign(allProperties, infoDensityProps);
		allAssets.push(...infoDensityAssets);
	}

	if (variants[userPreferenceVariant]) {
		const {properties: variantProps = {}, assets: variantAssets = []} =
			variants[userPreferenceVariant];

		Object.assign(allProperties, variantProps);
		allAssets.push(...variantAssets);
	}

	return {theme: allProperties, assets: allAssets};
}

function signalThemeUpdated() {
	document.dispatchEvent(new Event(UXF_THEME_UPDATED));
}

export function installTheme(
	//Default value cannot be provided for themeOptions as we check for
	//undefined in order to use legacy code paths.
	{theme = {}, assets = [], themeOptions} = {},
	targetNode = document.head,
	styleTagId = 'global-theme',
	cssSelector = ':root',
	keepDocumentTheme = false
) {
	if (themeOptions) {
		const themeOptionsResult = buildTheme(themeOptions);
		theme = themeOptionsResult.theme;
		assets = themeOptionsResult.assets;
	}

	const {fonts, images} = triageAssets(assets);
	installFonts(fonts);
	installImages(images);

	// @TODO(david.leonard): See comment above, this can be removed in Rome when
	// we pull out compatible theme props.
	theme = {...theme, ...COMPAT_THEME_PROPS};

	theme = {...theme, ...getImageAssetsCssVars(images)};
	theme = {...theme, ...STATIC_THEME_PROPS};
	var style = document.getElementById(styleTagId);

	const stylesheet = getDocumentLoadedThemeStylesheet();

	// May not want to remove original theme, such as in the case of UIB that uses 2 themes simultaneously (UIB & stage)
	if (stylesheet !== null && !keepDocumentTheme) {
		stylesheet.remove();
	}

	if (style) {
		style.textContent = printCssText(theme, cssSelector);
	} else {
		style = document.createElement('STYLE');
		style.id = styleTagId;
		style.textContent = printCssText(theme, cssSelector);
		targetNode.appendChild(style);
	}

	//Need to publish the resulting theme to the UX Global to keep contract with datavis and print usecases
	//Only do this if the style tag being updated is the global one.
	if (styleTagId === 'global-theme') {
		const UxGlobalTheme = getUxGlobal('theme');
		UxGlobalTheme.theme = theme;
		UxGlobalTheme.assets = assets;
		UxGlobalTheme.assets.images = images;
		UxGlobalTheme.themeOptions = themeOptions;
	}

	signalThemeUpdated();
	return {theme, assets, images, themeOptions};
}

function getDocumentLoadedThemeStylesheet() {
	return document.head.querySelector("link[data-source-id='glide-theme']");
}

export function loadTheme() {
	const stylesheet = getDocumentLoadedThemeStylesheet();
	if (stylesheet === null) {
		const theme = getUxGlobal('theme');
		if (theme) {
			installTheme(theme);
		}
	} else {
		signalThemeUpdated();
	}
}

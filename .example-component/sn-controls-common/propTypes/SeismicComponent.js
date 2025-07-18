/**
 * Additional props that are passed down to Seismic components
 * via the core framework. Most consumers of form controls shouldn't
 * really worry about these.
 *
 * @see [Seismic Docs](https://artifact.devsnc.com/content/sites/snc-doc-site/sn-component-docs/latest/)
 */
export const seismicComponentprops = {
	/**
	 * Seismic dispatcher
	 * @type {function}
	 */
	dispatch: { schema: { type: 'function' } },
	/**
	 * Unique identifier for the component
	 * @type {string}
	 * */
	componentId: { schema: { type: 'string' }, required: true, default: 'id' },
	/**
	 * Data returned by one of the Seismic resource handlers
	 * @type {object}
	 * */
	resources: { schema: { type: 'object' } },
	/**
	 * Asynchronous Message Bus (AMB) API
	 * @type {object}
	 */
	channels: { schema: { type: 'object' } }
};

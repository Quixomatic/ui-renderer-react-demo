/**
 * Util method to wrap helperContent with jsx to restrict width and height of field hint text
 * This is required to set the dimensions for NDS rendered helperContent, and renderer should be snabbdom
 * @param {string|JSX} helperContent
 */
export const wrapHelperContent = helperContent => {
	if (!helperContent) return helperContent;

	return (
		<div style={{ maxWidth: '300px', maxHeight: '200px' }}>{helperContent}</div>
	);
};

/**
 * Main TurboForge Form Component View (Snabbdom)
 *
 * This is the root Snabbdom component that acts as a state controller and container.
 * It renders the tf-catalog-form React bridge component and passes all properties to it.
 *
 * Architecture:
 * Snabbdom (this component) → React Bridge (tf-catalog-form) → Regular React Components
 */
import debug from './lib/debug.js';

export default (state) => {
	// Get comprehensive field data from state
	const {
		fields,
		formMessages,
		formValid,
		globals,
		clientScripts,
		uiPolicies,
		referenceData,
		referenceLoading,
		referencePagination,
		changesBatch
	} = state;

	// Get static properties
	const {
		formData,
		variablesLayout,
		readOnlyOption,
		renderStyle,
		variableGap,
		noGutter,
		sourceTable,
		sourceId,
	} = state.properties;

	debug.log('componentRender', 'View rendering with fields:', fields);

	return (
		<div className="turbo-forge-catalog-form-container">
			<tf-catalog-form
				formData={formData}
				fields={fields}
				variablesLayout={variablesLayout}
				formMessages={formMessages}
				formValid={formValid}
				readOnlyOption={readOnlyOption}
				renderStyle={renderStyle}
				variableGap={variableGap}
				noGutter={noGutter}
				sourceTable={sourceTable}
				sourceId={sourceId}
				globals={globals}
				clientScripts={clientScripts}
				uiPolicies={uiPolicies}
				referenceData={referenceData}
				referenceLoading={referenceLoading}
				referencePagination={referencePagination}
				changesBatch={changesBatch}
			/>
		</div>
	);
};

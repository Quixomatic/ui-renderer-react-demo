// Import the React bridge component
import './components/tf-mrvs-modal-form';

/**
 * MRVS Modal Container View (Snabbdom)
 *
 * This is the ServiceNow container component that renders the React bridge component.
 * It passes all state and properties to the bridge component.
 */
export default (state) => {
    const { properties } = state;

    // Only render if modal is active
    if (!properties.active) {
        return null;
    }

    // Get state data
    const {
        fields,
        variablesLayout,
        isLoading,
        error,
        formMessages,
        formValid,
        clientScripts,
        uiPolicies,
        globals,
        referenceData,
        referenceLoading,
        referencePagination,
		changesBatch
    } = state;

    // Render the React bridge component
    return (
        <div className="tf-mrvs-modal-container">
            <x-312987-tf-mrvs-modal-form
                // Pass container properties
                active={properties.active}
                variableSetName={properties.variableSetName}
                action={properties.action}
                onClose={properties.onClose}
                rowIndex={properties.rowIndex}
                sourceTable={properties.sourceTable}
                sourceId={properties.sourceId}

                // Pass container state
                fields={fields}
                variablesLayout={variablesLayout}
                isLoading={isLoading}
                error={error}
                formMessages={formMessages}
                formValid={formValid}
                clientScripts={clientScripts}
                uiPolicies={uiPolicies}
                globals={globals}

                // Reference field data
                referenceData={referenceData}
                referenceLoading={referenceLoading}
                referencePagination={referencePagination}

                // Field change batch
                changesBatch={changesBatch}
            />
        </div>
    );
};

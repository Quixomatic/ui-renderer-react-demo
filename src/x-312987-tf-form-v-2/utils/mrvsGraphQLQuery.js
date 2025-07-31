/**
 * MRVS GraphQL Query Builder
 * 
 * Generates the complete GraphQL query for fetching MRVS data
 * with all necessary field fragments and namespaced types.
 */

/**
 * Build the complete MRVS GraphQL query
 * @returns {string} The complete GraphQL query string
 */
export function buildMRVSQuery() {
    return `
        query MRVSQuery($variableSetId: String!, $rowData: String) {
            x312987Turbofo0 {
                tf_mrvs {
                    MRVSVariableSet(variableSetId: $variableSetId, rowData: $rowData) {
                        variableSetId
                        variableSetName
                        maxRows
                        layout
                        variablesLayout {
                            name
                            type
                            parent
                            caption
                            captionDisplay
                            layout
                            columns {
                                fields {
                                    name
                                    type
                                }
                            }
                        }
                        variables {
                            ... on x312987Turbofo0_tf_mrvs_MRVSStandardVariable {
                                type
                                id
                                name
                                variableName
                                label
                                order
                                mandatory
                                readOnly
                                visible
                                canRead
                                canWrite
                                canCreate
                                variableAttributes
                                defaultValue
                                value
                                displayValue
                                exampleText
                                helpText
                                regExp
                                __typename
                                
                                # Extended properties from x_312987_turbofo_0_question
                                subType
                                tooltip
                                parsedAttributes {
                                    limit
                                    enableSearch
                                    enablePagination
                                    placeholder
                                    maxlength
                                }
                                validation {
                                    name
                                    validation_message
                                    active
                                    regex
                                }
                                needsTextCompilation
                                compiledValue
                            }
                            ... on x312987Turbofo0_tf_mrvs_MRVSReferenceVariable {
                                type
                                id
                                name
                                variableName
                                label
                                order
                                mandatory
                                readOnly
                                visible
                                canRead
                                canWrite
                                canCreate
                                variableAttributes
                                defaultValue
                                value
                                displayValue
                                exampleText
                                helpText
                                regExp
                                reference
                                referenceQual
                                __typename
                                
                                # Extended properties from x_312987_turbofo_0_question
                                subType
                                tooltip
                                parsedAttributes {
                                    limit
                                    enableSearch
                                    enablePagination
                                    placeholder
                                    maxlength
                                }
                                validation {
                                    name
                                    validation_message
                                    active
                                    regex
                                }
                                compiledValue
                                
                                # Reference-specific extended properties
                                tableFields {
                                    column_label {
                                        value
                                        display_value
                                    }
                                    element {
                                        value
                                        display_value
                                    }
                                    type {
                                        value
                                        display_value
                                    }
                                }
                                qualifier
                                valueField
                            }
                            ... on x312987Turbofo0_tf_mrvs_MRVSChoiceVariable {
                                type
                                id
                                name
                                variableName
                                label
                                order
                                mandatory
                                readOnly
                                visible
                                canRead
                                canWrite
                                canCreate
                                variableAttributes
                                defaultValue
                                value
                                displayValue
                                exampleText
                                helpText
                                regExp
                                choices {
                                    value
                                    displayValue
                                }
                                includeNone
                                __typename
                                
                                # Extended properties from x_312987_turbofo_0_question
                                subType
                                tooltip
                                parsedAttributes {
                                    limit
                                    enableSearch
                                    enablePagination
                                    placeholder
                                    maxlength
                                }
                                validation {
                                    name
                                    validation_message
                                    active
                                    regex
                                }
                                compiledValue
                                
                                # Choice/Numeric Scale specific extended properties
                                min
                                max
                            }
                            ... on x312987Turbofo0_tf_mrvs_MRVSAttachmentVariable {
                                type
                                id
                                name
                                variableName
                                label
                                order
                                mandatory
                                readOnly
                                visible
                                canRead
                                canWrite
                                canCreate
                                variableAttributes
                                defaultValue
                                value
                                displayValue
                                exampleText
                                helpText
                                regExp
                                allowedFileExtensions
                                maxAttachmentSize
                                __typename
                                
                                # Extended properties from x_312987_turbofo_0_question
                                subType
                                tooltip
                                parsedAttributes {
                                    limit
                                    enableSearch
                                    enablePagination
                                    placeholder
                                    maxlength
                                }
                                validation {
                                    name
                                    validation_message
                                    active
                                    regex
                                }
                                compiledValue
                            }
                            ... on x312987Turbofo0_tf_mrvs_MRVSContainerVariable {
                                type
                                id
                                name
                                variableName
                                label
                                order
                                mandatory
                                readOnly
                                visible
                                canRead
                                canWrite
                                canCreate
                                variableAttributes
                                defaultValue
                                value
                                displayValue
                                exampleText
                                helpText
                                regExp
                                displayTitle
                                layout
                                containerType
                                __typename
                                
                                # Extended properties from x_312987_turbofo_0_question
                                subType
                                tooltip
                                parsedAttributes {
                                    limit
                                    enableSearch
                                    enablePagination
                                    placeholder
                                    maxlength
                                }
                                validation {
                                    name
                                    validation_message
                                    active
                                    regex
                                }
                                compiledValue
                            }
                        }
                        clientScripts {
                            onChange {
                                name
                                sysId
                                script
                                type
                                fieldName
                            }
                            onLoad {
                                name
                                sysId
                                script
                                type
                            }
                            onSubmit {
                                name
                                sysId
                                script
                                type
                            }
                        }
                        uiPolicies {
                            shortDescription
                            sysId
                            reverse
                            onLoad
                            actions {
                                name
                                visible
                                disabled
                                mandatory
                                cleared
                            }
                            conditions {
                                term
                                field
                                fieldLabel
                                type
                                value
                                oper
                                operatorLabel
                            }
                        }
                    }
                }
            }
        }
    `;
}

/**
 * Transform GraphQL response to expected format
 * @param {Object} response - GraphQL response
 * @returns {Object} Transformed MRVS data
 */
export function transformMRVSResponse(response) {
    if (!response?.data?.x312987Turbofo0?.tf_mrvs?.MRVSVariableSet) {
        throw new Error('Invalid MRVS GraphQL response structure');
    }

    const mrvsData = response.data.x312987Turbofo0.tf_mrvs.MRVSVariableSet;
    
    // Transform to match our expected component format (same as main catalog form)
    return {
        variableSetId: mrvsData.variableSetId,
        variableSetName: mrvsData.variableSetName,
        maxRows: mrvsData.maxRows,
        layout: mrvsData.layout,
        
        // Transform variables array to fields object using field names as keys
        fields: mrvsData.variables.reduce((acc, variable) => {
            acc[variable.name] = variable;
            return acc;
        }, {}),
        
        variablesLayout: mrvsData.variablesLayout,
        
        clientScripts: mrvsData.clientScripts || {
            onChange: [],
            onLoad: [],
            onSubmit: []
        },
        
        uiPolicies: mrvsData.uiPolicies || []
    };
}
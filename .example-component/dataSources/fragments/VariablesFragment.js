import { createQueryFragment } from '../../tf-library-catalog-form/src/dataSource/createQueryFragment';
import {VARIABLES_CHANNEL} from './channelConstants';
import {VARIABLES_FRAGMENT_PREFIX} from './queryConstants';
import {variablesFragmentResponseHandler} from './responseHandlers/variablesFragmentResponseHandler';

const VariablesFragment = createQueryFragment({
	prefix: VARIABLES_FRAGMENT_PREFIX,
	variables: [],
	queryTemplate: () => {
		return `
            ${VARIABLES_FRAGMENT_PREFIX} {
                ... on AppCatalog_MultiRowVariableSetType {
                    type
                    name
                    label
                    containerType
                    canRead
                    canWrite
                    canCreate
                    variableName
                    id
                    maxRows
                    fields {
                        name
                        id
                        label
                        type
                        unique
                    }
                    rowData {
                        row {
                        id
                        value
                        displayValue
                        }
                    }
                }
                ... on AppCatalog_SingleRowVariableSetType {
                    type
                    id
                    name
                    label
                    containerType
                    visible
                    canRead
                    canWrite
                    canCreate
                    variableName
                }
                ... on AppCatalog_ChoiceQuestionElementType {
                    type
                    id
                    name
                    variableName
                    label
                    order
                    catalogItem
                    variableSet
                    mandatory
                    readOnly
                    visible
                    canRead
                    canWrite
                    canCreate
                    variableAttributes
                    defaultValue
                    dynamicValueField
                    dynamicValueDotWalkPath
                    lookupTable
                    lookupValue
                    lookupLabel
                    includeNone
                    lookupUnique
                    choiceTable
                    choiceField
                    choiceDirection
                    choices {
                        displayValue: label
                        value
                    }
                    dependentField
                    referringTable
                    referringRecordId
                    hasPriceImplecations
                    showHelp
                    helpText
                    instructions
                }
                ... on AppCatalog_ReferenceQuestionElementType {
                    type
                    id
                    name
                    variableName
                    label
                    order
                    catalogItem
                    variableSet
                    mandatory
                    readOnly
                    visible
                    canRead
                    canWrite
                    canCreate
                    reference
                    referenceQual
                    listTable
                    useReferenceQualifier
                    variableAttributes
                    defaultValue
                    dynamicValueField
                    dynamicValueDotWalkPath
                    referringTable
                    referringRecordId
                    refAcOrderBy
                    hasPriceImplecations
                    showHelp
                    helpText
                    instructions
                }
                ... on AppCatalog_ContainerQuestionElementType {
                    type
                    id
                    name
                    variableName
                    label
                    order
                    visible
                    canRead
                    canWrite
                    canCreate
                    catalogItem
                    variableSet
                    displayTitle
                    layout
                    containerType
                    hasPriceImplecations
                    showHelp
                    helpText
                    instructions
                }
                ... on AppCatalog_AttachmentQuestionElementType {
                    type
                    id
                    name
                    variableName
                    label
                    order
                    catalogItem
                    variableSet
                    mandatory
                    readOnly
                    visible
                    canRead
                    canWrite
                    canCreate
                    allowedFileExtensions
                    maxAttachmentSize
                    variableAttributes
                    defaultValue
                    contentType
                    showHelp
                    helpText
                    instructions
                }
                ... on AppCatalog_MacroQuestionElementType {
                    type
                    id
                    name
                    variableName
                    label
                    order
                    catalogItem
                    variableSet
                    mandatory
                    canRead
                    canWrite
                    canCreate
                    variableAttributes
                    defaultValue
                    dynamicValueField
                    dynamicValueDotWalkPath
                    macroponentId
                    showHelp
                    helpText
                    instructions
                }
                ... on AppCatalog_StandardQuestionElementType {
                    type
                    id
                    name
                    variableName
                    label
                    order
                    catalogItem
                    variableSet
                    mandatory
                    readOnly
                    visible
                    canRead
                    canWrite
                    canCreate
                    variableAttributes
                    defaultValue
                    dynamicValueField
                    dynamicValueDotWalkPath
                    exampleText
                    useConfirmation
                    regExp
                    canDecrypt
                    hasPriceImplecations
                    showHelp
                    helpText
                    instructions
                }
                __typename
            }
            `;
	},
	responseHandler: variablesFragmentResponseHandler,
	channels: [VARIABLES_CHANNEL],
	children: []
});
export default VariablesFragment;

import '../src/x-312987-tf-form-v-2';
import exampleData from '../.example-data/example-response.json';

const html = document.querySelector('html');
html.style = `
height: 100%;
background: #faf9f5;
`;

const el = document.createElement('DIV');
document.body.appendChild(el);

// Extract the catalog form data from the example response
const formData = exampleData.f.formData;
const fields = formData.fields;
const variablesLayout = formData.variablesLayout;

// Create the component with test data
const catalogFormComponent = document.createElement('x-312987-tf-form-v-2');

// Set properties from example data
catalogFormComponent.formData = formData;
catalogFormComponent.fields = fields;
catalogFormComponent.variablesLayout = variablesLayout;
catalogFormComponent.sourceTable = 'sc_cart_item';
catalogFormComponent.sourceId = exampleData.f.targetRecord?.sysId || '';
catalogFormComponent.readOnlyOption = 'default';
catalogFormComponent.renderStyle = 'default';
catalogFormComponent.variableGap = 'md';
catalogFormComponent.noGutter = false;

// Add client scripts and UI policies
catalogFormComponent.clientScripts = formData.client_scripts || {};
catalogFormComponent.uiPolicies = formData.ui_policy || [];
catalogFormComponent.validationScripts = formData.validation_scripts || [];

// Append to container
el.appendChild(catalogFormComponent);

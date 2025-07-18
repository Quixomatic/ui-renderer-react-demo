import { createCustomElement } from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';
import view from './view';
import styles from './styles.scss';
import { READONLY_OPTION, RENDER_STYLE } from '../common/constants';

/**
 * Catalog form is a display only component, which displays the variables
 * for both catalog item and tasks.
 *
 * ```jsx
 * <sn-catalog-form
 *		formData={...}
 *		sourceTable='sc_req_item'
 *		sourceId='f59755f3c703201046e7dc8703c260e0'
 *		fields={...}
 *		variablesLayout={...}
 *		noGutter=false
 *		readOnlyOption=default
 *		renderStyle=default
 *		variableGap=md
 *		/>
 * ```
 * @summary Displays catalog variables
 * @seismicElement sn-catalog-form
 */
createCustomElement('sn-catalog-form', {
	renderer: { type: snabbdom },
	view,
	properties: {
		/**
		 * Form data object containing catalog form data.
		 * @type {object}
		 */
		formData: {
			default: {}
		},
		/**
		 * Source table where the variables are being displayed.
		 * @type {string}
		 */
		sourceTable: {
			default: ''
		},
		/**
		 * SysId of the source record.
		 * @type {string}
		 */
		sourceId: {
			default: ''
		},
		/**
		 * Contains information about the variables within the catalog item.
		 * It is a map with the 'variables.<variable_name>' key and 'variable properties object' value.
		 * @type {{variables.variable1: {object}, variables.variable2: {object}}}
		 */
		fields: {
			default: {}
		},
		/**
		 * Determines the order in which the variables will be displayed in the form.
		 * It is an array of objects where each object holds information related to the field such as name, type, parent.
		 * When the type of the variable is container, additional information such as columns, caption, layout will be available.
		 * @type {Array.<{name:string, type:string, parent:string, caption:string, captionDisplay:string, layout: string, columns: Array.<{fields: Array<{name:string, type:string}>}>}>}
		 */
		variablesLayout: {
			default: {}
		},
		/**
		 * When set to true, the left and right margins would be removed for the variables.
		 * @type {boolean}
		 */
		noGutter: {
			default: false
		},
		/**
		 * When set to printable, the read-only variables become non editable.
		 * @type {('default'|'printable')}
		 */
		readOnlyOption: {
			default: READONLY_OPTION.DEFAULT,
			schema: {
				type: 'string',
				enum: [READONLY_OPTION.DEFAULT, READONLY_OPTION.PRINTABLE]
			}
		},
		/**
		 * This property is used to alter the width of variables other than HTML, Custom, etc.
		 * 'renderStyle:default', the variable is displayed with 100% width
		 * 'renderStyle:compact', the variable is displayed with 50% width
		 * @type {('default'|'compact')}
		 */
		renderStyle: {
			default: RENDER_STYLE.DEFAULT,
			schema: {
				type: 'string',
				enum: [RENDER_STYLE.DEFAULT, RENDER_STYLE.COMPACT]
			}
		},
		/**
		 * This property is used to define the gap between variables.
		 * @type {('sm'|'md'|'lg'|'xl')}
		 */
		variableGap: {
			default: 'md',
			schema: {
				type: 'string',
				enum: ['sm', 'md', 'lg', 'xl']
			}
		},

		formDispatch: {
			default: {}
		}
	},
	styles
});

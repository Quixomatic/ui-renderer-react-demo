import {createCustomElement} from '@servicenow/ui-core';
import snabbdom from '@servicenow/ui-renderer-snabbdom';

import actionHandlers from './actions';
import view from './view';

export const SNDeclarativeMediator = 'sn-declarative-mediator';

/**
 * Helper component which wraps other components which rely on declarative actions
 * The component handles everything related to executing and evaluating conditions of the declarative action
 * dispatched by the slotted component and sending the results back down to the child through props
 *
 * ```jsx
 * <sn-declarative-mediator>
 *		<other-component-which-renders-declarative-action
 *			{...properties}
 *		/>
 * </sn-declarative-mediator>
 * ```
 *
 * @seismicElement sn-declarative-mediator
 * @summary Helper component which wraps other components which rely on declarative actions
 * and handles execution of the action for the wrapped component
 */
createCustomElement(SNDeclarativeMediator, {
	renderer: {
		type: snabbdom,
		view
	},
	initialState: {
		action: {},
		model: {},
		key: null,
		displayConfirmation: false,
		dynamicConditionResults: {}
	},
	properties: {
		/**
		 * Whether or not it should dispatch a wrapped action with an actual action in a payload for DISPATCH_ACTION and UXF_CLIENT_ACTION type
		 * @type {boolean}
		 */
		shouldWrapAction: {
			schema: {
				type: 'boolean'
			},
			default: false
		},
		/**
		 * Whether or not it should work on Dynamic Evaluation for DAs
		 */
		shouldEvaluateDynamicConditions: {
			schema: {
				type: 'boolean'
			},
			default: false
		},
		/**
		 * Whether or not it should append actionEvent to payload to describe the event triggerring the action
		 * The value of actionEvent comes from either
		 *  1. action.meta.actionEvent
		 *  2. action.meta.event (default)
		 *
		 * actionEvent schema:
		 * 	actionEvent: {
		 * 		schema: {
		 * 			type: 'object',
		 * 			properties: {
		 * 				target: {
		 * 					type: 'object',
		 * 					description: 'a reference to action event's target element'
		 * 				},
		 * 				type: {
		 * 					type: 'string',
		 * 					description: 'event type'
		 * 				},
		 * 				metaKey: {
		 * 					type: 'boolean',
		 * 					description: 'indicates whether the meta key was pressed or not when the event occurs'
		 * 				}
		 * 			}
		 * 		}
		 * 	}
		 * @type {boolean}
		 */
		shouldAppendActionEvent: {
			schema: {
				type: 'boolean'
			},
			default: false
		},
		/**
		 * Prop for Dynamically Evaluated DA's
		 * All the Declarative Action SysIds needed to be evaluated
		 * @type {Array.<Object>}
		 */
		declarativeActions: {
			schema: {
				type: 'array'
			},
			default: [],
			deepCompare: true
		},
		/**
		 * List info needed when used in Lists/Related Lists
		 * Prop for Dynamically Evaluated DA's
		 * @type {{model: string, recordSysIds: Array.<string>,conditions: string,selectedRecords: Array.<string>,editedRecords: Array.<string>,listRefresh: Object,declarativeActions: Array.<Object>,daRelayPropName: string,table: string,parentTable: string,parentRecordSysId: string}}
		 */
		modelData: {
			schema: {
				type: 'object',
				properties: {
					/**
					 * Prop for Dynamically Evaluated DA's [Lists].
					 * Model type list / form
					 * For Future use
					 * @type {string}
					 */
					model: {
						schema: {
							type: 'string'
						},
						default: ''
					},
					/**
					 * Prop for Dynamically Evaluated DA's [Lists]
					 * All the Record SysIds needed to be evaluated
					 * @type {Array.<string>}
					 */
					recordSysIds: {
						schema: {
							type: 'array'
						},
						default: []
					},

					/**
					 * Filter conditions for the current list.
					 * Used for "Select All" use case
					 * @type {string}
					 */
					conditions: {
						schema: {
							type: 'string'
						},
						default: ''
					},
					/**
					 * Prop for Dynamically Evaluated DA's [Lists]
					 * All the selected/checked Record SysIds needed to be evaluated
					 * @type {Array.<string>}
					 */
					selectedRecords: {
						schema: {
							type: 'array'
						},
						default: []
					},
					/**
					 * Prop for Dynamically Evaluated DA's [Lists]
					 * All the inline Edited Record SysIds needed to be evaluated
					 * @type {Array.<string>}
					 */
					editedRecords: {
						schema: {
							type: 'array'
						},
						default: []
					},
					/**
					 * Prop for Dynamically Evaluated DA's [Lists]
					 * Flag for inline Edited Records to be evaluated - Timestamp
					 * @type {string}
					 */
					cellUpdatedOn: {
						schema: {
							type: 'string'
						},
						default: ''
					},
					/**
					 * Prop for Dynamically Evaluated DA's [Lists].
					 * Last time the record list was refreshed
					 * @type {{}}
					 */
					listRefresh: {
						schema: {
							type: 'object'
						},
						default: {}
					},
					/**
					 * Child component property name to which the dynamically evaluated Declarative Actions will be passed down.
					 * ex. Used for Enable/Disable DA's based on Record Selection on Lists
					 * @type {string}
					 */
					daRelayPropName: {
						schema: {
							type: 'string'
						},
						default: ''
					},
					/**
					 * Prop for Dynamically Evaluated DA's
					 * Table Name for the Dynamic evaluation
					 * @type {string}
					 */
					table: {
						schema: {
							type: 'string'
						},
						default: ''
					},
					/**
					 * Prop for Dynamically Evaluated DA's
					 * Parent Table Name for the Dynamic evaluation
					 * @type {string}
					 */
					parentTable: {
						schema: {
							type: 'string'
						},
						default: ''
					},
					/**
					 * Prop for Dynamically Evaluated DA's
					 * Parent Record SysId for the Dynamic evaluation
					 * @type {string}
					 */
					parentRecordSysId: {
						schema: {
							type: 'string'
						},
						default: ''
					}
				}
			},
			default: {},
			deepCompare: true
		}
	},
	actionHandlers,
	dispatches: {
		/**
		 * Dispatched once the declarative action execution has completed indicating success or failure
		 * @type {AddNotificationsPayload[]}
		 */
		ADD_NOTIFICATIONS: {},
		/**
		 * Dispatched on successful action execution
		 * @type {object}
		 */
		REFRESH_REQUESTED: {}
	}
});

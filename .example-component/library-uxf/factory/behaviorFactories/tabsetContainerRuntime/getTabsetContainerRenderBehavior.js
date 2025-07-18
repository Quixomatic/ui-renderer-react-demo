import {get} from '@devsnc/snowdash';
import {
	COMPOSITION_ELEMENT_ID,
	UXF_TABSET_NON_VIEWPORT_CONTAINER_RENDER_REQUESTED
} from '../../constants';

/**
 * getTabsetContainerRenderBehavior: This behavior optimize the rendering of tab set active contents. The tab set
 *  containers are loaded on-demand corresponding to the active tab item.
 * @returns {{
 * 	initialState: {elements: {}},
 * 	actionHandlers: {[p: string]: {effect: function(*): void, stopPropagation: boolean},
 * 	"[UXF_TABSET_NON_VIEWPORT_CONTAINER_RENDER_REQUESTED]": {effect: effect, stopPropagation: boolean}},
 * 	name: string
 * }}
 */
export default () => {
	return {
		name: 'tabsetRuntime',
		initialState: {
			elements: {}
		},
		actionHandlers: {
			[UXF_TABSET_NON_VIEWPORT_CONTAINER_RENDER_REQUESTED]: {
				effect: (coeffects) => {
					const {
						action: {
							payload: {activeSlot},
							meta: {appended: appendedSourceActionMeta = {}}
						},
						state,
						updateState
					} = coeffects;

					const elementId = appendedSourceActionMeta[COMPOSITION_ELEMENT_ID];
					const tabsetRuntimeElementsBasePath = `behaviors.tabsetRuntime.elements.${elementId}`;
					const activeSlotPath = `${tabsetRuntimeElementsBasePath}.activeSlot`;
					const nonViewportSlotsPath = `${tabsetRuntimeElementsBasePath}.nonViewportSlots`;
					const nonViewportSlots = get(state, nonViewportSlotsPath, new Set());

					updateState([
						{
							path: nonViewportSlotsPath,
							operation: 'set',
							value: nonViewportSlots.add(activeSlot)
						},
						{
							path: activeSlotPath,
							operation: 'set',
							value: activeSlot
						}
					]);
				},
				stopPropagation: true
			}
		}
	};
};

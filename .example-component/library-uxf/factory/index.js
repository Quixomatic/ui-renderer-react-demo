import {createMacroponent} from './createMacroponent';
import {GenerateLayout} from './layout';
import _resolveUxValuesForView from './UxValueResolver/resolveForViewWithSelectableProps';

export const registerMacroponent = createMacroponent;
export const resolveUxValuesForView = _resolveUxValuesForView;

// default export exists only for backwards compat. use named export above
export default {
	GenerateLayout,
	registerMacroponent: createMacroponent,
	resolveUxValuesForView: _resolveUxValuesForView
};

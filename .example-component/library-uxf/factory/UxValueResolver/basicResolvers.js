import getResolvedClientTransform from './getResolvedClientTransform.js';
import getResolvedBinary from './getResolvedBinary';
import getResolvedUnary from './getResolvedUnary';
import getResolvedTranslationLiteral from './getResolvedTranslationLiteral';
import getResolvedContainer from './containers';
import {propertyTypes} from '../constants.js';

const {CLIENT_TRANSFORM, BINARY, UNARY, TRANSLATION_LITERAL} = propertyTypes;

export default {
	[CLIENT_TRANSFORM]: getResolvedClientTransform,
	[BINARY]: getResolvedBinary,
	[UNARY]: getResolvedUnary,
	[TRANSLATION_LITERAL]: getResolvedTranslationLiteral,
	container: getResolvedContainer
};

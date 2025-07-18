export const fieldLayoutSchema = {
	type: 'object',
	properties: {
		layout: {
			default: 'vertical',
			schema: {type: 'string', enum: ['vertical', 'horizontal']}
		},
		columns: {default: [], schema: {type: 'array'}}
	}
};

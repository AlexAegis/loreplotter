import { RxJsonSchema } from 'rxdb';

export const actorSchema: RxJsonSchema = {
	title: 'Actor',
	description: 'Actor Object, describes a series of events',
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		id: {
			type: 'string',
			primary: true
		},
		loreId: {
			type: 'string',
			ref: 'lore'
		},
		states: {
			type: 'string'
		}
	},
	required: ['id', 'loreId']
};

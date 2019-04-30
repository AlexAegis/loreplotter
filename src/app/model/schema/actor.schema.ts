import { RxJsonSchema } from 'rxdb';

export const actorSchema: RxJsonSchema = {
	title: 'Actor',
	description: 'Actor Object, describes a series of events',
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		lore: {
			type: 'string',
			ref: 'lore'
		},
		id: {
			type: 'string',
			primary: true
		},
		states: {
			type: 'string'
		}
	},
	required: ['id']
};

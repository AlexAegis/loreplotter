import { RxJsonSchema } from 'rxdb';
import { Actor } from '../data';

export const actorSchema: RxJsonSchema<Partial<Actor>> = {
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

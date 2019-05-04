import { RxJsonSchema } from 'rxdb';
import { planetSchema } from './planet.schema';

export const loreSchema: RxJsonSchema = {
	title: 'Lore',
	description: 'Project object, contains actors and the texture of the planet and such',
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		id: {
			type: 'string',
			primary: true
		},
		name: {
			type: 'string',
		},
		locations: {
			type: 'array',
			uniqueItems: true,
			default: [],
			items: {
				type: 'string'
			}
		},
		planet: planetSchema
	},
	attachments: {
		encrypted: false
	},
	required: ['id', 'name']
};

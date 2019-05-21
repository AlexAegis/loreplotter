import { RxJsonSchema } from 'rxdb';
import { planetSchema } from './planet.schema';

export const loreSchema: RxJsonSchema = {
	title: 'Lore',
	description: 'Project object',
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		id: {
			primary: true,
			type: 'string',
			uniqueItems: true
		},
		name: {
			type: 'string',
			uniqueItems: true
		},
		planet: planetSchema
	},
	attachments: {
		encrypted: false
	},
	required: ['id', 'name']
};

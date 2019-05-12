import { RxJsonSchema } from 'rxdb';
import { Planet, planetSchema } from './planet.interface';

/**
 * Has an attachment for the planets texture
 */
export interface Lore {
	id: string;
	name: string;
	planet: Planet;
}

export const loreSchema: RxJsonSchema = {
	title: 'Lore',
	description: 'Project object, contains actors and the texture of the planet and such',
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

import { Planet, planetSchema } from './planet.class';
import { RxJsonSchema } from 'rxdb';

import { Actor, actorSchema } from './actor.class';
/**
 * Has an attachment for the planets texture
 */
export class Lore {
	name: string;
	actors: Array<Actor> = [];
	locations: Array<string> = [];
	planet: Planet;
}

export const loreSchema: RxJsonSchema = {
	title: 'Lore',
	description: 'Project object, contains actors and the texture of the planet and such',
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		name: {
			type: 'string',
			primary: true
		},
		actors: {
			type: 'array',
			default: [],
			uniqueItems: true,
			items: actorSchema
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
	required: ['name']
};

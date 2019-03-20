import { Actor, actorSchema } from './actor.class';
import { RxJsonSchema, RxJsonSchemaTopLevel } from 'rxdb';
export class Lore {
	name: string;
	actors: Array<Actor> = [];
	locations: Array<string> = [];
}

export const loreSchema: RxJsonSchema = {
	title: 'Lore',
	description: 'Project object, contains actors and such',
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
			uniqueItems: true,
			items: actorSchema
		},
		locations: {
			type: 'array',
			uniqueItems: true,
			items: {
				type: 'string'
			}
		}
	},
	required: ['name']
};

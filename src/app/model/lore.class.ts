import { Actor, actorSchema } from './actor.class';
import { RxJsonSchema, RxJsonSchemaTopLevel } from 'rxdb';
import { toJson, jsonObject, jsonMember, jsonArrayMember } from 'typedjson';

// @jsonObject()
// @toJson
export class Lore {
	// @jsonMember({ constructor: String.prototype.constructor })
	name: string;
	// @jsonArrayMember(Actor.prototype.constructor)
	actors: Array<Actor> = [];
	// @jsonArrayMember(String.prototype.constructor)
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
		}
	},
	required: ['name']
};

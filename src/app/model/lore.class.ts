import { Planet, planetSchema } from './planet.class';
import { Tree } from '@alexaegis/avl';
import { RxJsonSchema } from 'rxdb';

import { Actor, actorSchema } from './actor.class';
import { TextureDelta } from './texture-delta.class';
import { UnixWrapper } from './unix-wrapper.class';

// @jsonObject()
// @toJson
export class Lore {
	// @jsonMember({ constructor: String.prototype.constructor })
	name: string;
	// @jsonArrayMember(Actor.prototype.constructor)
	actors: Array<Actor> = [];
	// @jsonArrayMember(String.prototype.constructor)
	locations: Array<string> = [];
	texture: string;
	planet: Planet;
	// textureTree: Tree<UnixWrapper, TextureDelta> = new Tree<UnixWrapper, TextureDelta>();
	// textureTreeString: string;
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
	required: ['name']
};

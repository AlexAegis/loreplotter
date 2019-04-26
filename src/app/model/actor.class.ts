import { Tree } from '@alexaegis/avl';
import { RxJsonSchema } from 'rxdb';

import { ActorDelta } from './actor-delta.class';
import { UnixWrapper } from './unix-wrapper.class';

/**
 * Should be serializable on its own
 */
export class Actor {
	constructor(id: string, lore?: string) {
		this.id = id;
		this.lore = lore;
	}
	public lore: string;
	public id: string;
	public states: Tree<UnixWrapper, ActorDelta> = new Tree<UnixWrapper, ActorDelta>(); // Self ordering structure
	public statesString: string;
}

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
		statesString: {
			type: 'string'
		}
	},
	required: ['id']
};

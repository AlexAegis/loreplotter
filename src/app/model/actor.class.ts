import { UnixWrapper } from './unix-wrapper.class';
import { Moment } from 'moment';
import * as moment from 'moment';
import { ActorDelta } from './actor-delta.class';
import { Tree, Node, Enclosing } from '@alexaegis/avl';
import { RxJsonSchema } from 'rxdb';
import { toJson, jsonObject, jsonMember } from 'typedjson';

/**
 * Should be serializable on its own
 */
export class Actor {
	constructor(id: string) {
		console.log(`actor created with id: ${id}`);
		this.id = id;
	}
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
		id: {
			type: 'string'
		},
		statesString: {
			type: 'string'
		}
	},
	required: ['id']
};

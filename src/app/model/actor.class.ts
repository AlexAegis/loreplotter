import { Moment } from 'moment';
import { ActorDelta } from './actor-delta.class';
import { Tree } from '@alexaegis/avl';
import { RxJsonSchema } from 'rxdb';

export class Actor {
	// TODO: Add a moment comparator
	states: Tree<Moment, ActorDelta> = new Tree(); // Self ordering structure

	constructor(public id: number) {}
}

export const actorSchema: RxJsonSchema = {
	title: 'Actor',
	description: 'Actor Object, describes a series of events',
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		id: {
			type: 'number'
		},
		states: {
			// Todo: separate Tree schema
			type: 'object'
		}
	},
	required: ['id']
};

import { Moment } from 'moment';
import * as moment from 'moment';
import { ActorDelta } from './actor-delta.class';
import { Tree } from '@alexaegis/avl';
import { RxJsonSchema } from 'rxdb';
import { jsonObject, jsonMember, toJson } from 'typedjson';
import { StateHistoryPlugin } from '@datorama/akita';

// @jsonObject()
// @toJson

interface unixWrapper {
	unix: number;
}
export class Actor {
	constructor(id: number) {
		this.id = id;
	}
	// @jsonMember({ constructor: Number.prototype.constructor })
	public id: number;
	// TODO: Add a moment comparator
	// @jsonMember({ constructor: Tree.prototype.constructor })
	public states: Tree<unixWrapper, ActorDelta> = new Tree(Actor.unixWrapperComparator); // Self ordering structure
	public statesString: string;

	public static momentComparator = (a: Moment, b: Moment) => a.unix() - b.unix();
	public static unixWrapperComparator = (a: unixWrapper, b: unixWrapper) => a.unix - b.unix;

	setState(when: number, state: ActorDelta): Actor {
		this.states.set({ unix: when }, state);
		return this;
	}

	getStateAt(m: Moment): ActorDelta {
		return this.states.get({ unix: m.unix() });
	}
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
		statesString: {
			// Todo: separate Tree schema
			type: 'string'
		}
	},
	required: ['id']
};

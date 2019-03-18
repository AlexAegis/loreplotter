import { Moment } from 'moment';
import { ActorDelta } from './actor-delta.class';
import { Tree } from '@alexaegis/avl';

export class Actor {
	public id: number;
	// TODO: Add a moment comparator
	states: Tree<Moment, ActorDelta> = new Tree(); // Self ordering structure
}

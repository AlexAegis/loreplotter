import { Tree } from '@alexaegis/avl';

import { ActorDelta, UnixWrapper } from '@app/model/data';

/**
 * Should be serializable on its own
 */
export class Actor {
	public static DEFAULT_MAX_SPEED = 4;
	public static DEFAULT_COLOR = `#e63100`; // 1a56e6 e60719
	public constructor(public id: string, public loreId?: string) {}
	public _states: Tree<UnixWrapper, ActorDelta> = new Tree<UnixWrapper, ActorDelta>(); // handled as transient
	public states: string;
	public _userdata: any; // handled as transient
}

export function serializeActor(actor: Actor): Actor {
	if (actor !== undefined && actor !== null) {
		if (actor._states) {
			for (const node of actor._states.nodes()) {
				node.key.unix = Math.floor(node.key.unix);
			}
			actor.states = actor._states.stringify();
			delete actor._states;
		}
		delete actor._userdata;
	}
	return actor;
}

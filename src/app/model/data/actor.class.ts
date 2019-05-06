import { Tree } from '@alexaegis/avl';

import { ActorDelta, UnixWrapper } from '@app/model/data';

/**
 * Should be serializable on its own
 */
export class Actor {
	public static DEFAULT_MAX_SPEED = 4;
	public static DEFAULT_COLOR = `#1a56e6`;
	public constructor(public id: string, public loreId?: string) {}
	public _states: Tree<UnixWrapper, ActorDelta> = new Tree<UnixWrapper, ActorDelta>(); // handled as transient
	public states: string;
	public _userdata: any; // handled as transient
}

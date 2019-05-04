import { Tree } from '@alexaegis/avl';

import { ActorDelta, UnixWrapper } from '@app/model/data';

/**
 * Should be serializable on its own
 */
export class Actor {
	constructor(public id: string, public loreId?: string) {}
	public _states: Tree<UnixWrapper, ActorDelta> = new Tree<UnixWrapper, ActorDelta>(); // handled as transient
	public states: string;
	public _userdata: any; // handled as transient
}

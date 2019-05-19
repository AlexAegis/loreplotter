import { Actor } from '@app/model/data';
import { RxDocument } from 'rxdb';

export function refreshBlockOfActor(actor: RxDocument<Actor>): void {
	if (actor._userdata && actor._userdata.block) {
		const b = actor._userdata.block;
		b.blockStart.original = b.blockStart.override = actor._states.first().key.unix;
		b.blockEnd.original = b.blockEnd.override = actor._states.last().key.unix;
		b.update();
	}
}

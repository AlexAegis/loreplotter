import { Injectable } from '@angular/core';

import { Actor } from '../model/actor.class';

@Injectable({
	providedIn: 'root'
})
export class ActorService {
	constructor() {}

	mergeKnowledge(actor: Actor, until: number) {
		for (const node of actor.states.nodes()) {
		}
	}
}

import { Injectable } from '@angular/core';
import { EngineService } from '@app/lore/engine/engine.service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { combineLatest } from 'rxjs';
import { auditTime, filter, map, share } from 'rxjs/operators';
import { LoreService } from './lore.service';

@Injectable()
export class ActorService {
	constructor(
		private loreService: LoreService,
		private engineService: EngineService,
		private storeFacade: StoreFacade
	) {}
	// TODO: Also trigger on editing the actor!
	private knowledgeAndNameTriggerOfSelected$ = combineLatest([
		this.engineService.selected.pipe(
			filter(actorObject => actorObject !== undefined),
			map(actorObject => actorObject.actor)
		),
		this.storeFacade.cursorUnix$
	]).pipe(
		auditTime(1000 / 60),
		share()
	);

	public knowledgeOfSelected$ = this.knowledgeAndNameTriggerOfSelected$.pipe(
		map(([actor, cursor]) => {
			const accumulator = new Map<String, String>();
			for (const node of actor._states.nodes()) {
				if (node.key.unix > cursor) {
					break;
				}
				for (const [key, value] of node.value.knowledge.entries()) {
					if (value !== undefined) {
						accumulator.set(key, value);
					}
				}
			}
			return accumulator;
		}),
		share()
	);
	public nameOfSelected$ = this.knowledgeAndNameTriggerOfSelected$.pipe(
		map(([actor, cursor]) => {
			let accumulator = '';
			for (const node of actor._states.nodes()) {
				if (node.key.unix > cursor) {
					break;
				}
				if (node.value.name !== undefined) {
					accumulator = node.value.name;
				}
			}
			return accumulator;
		}),
		share()
	);
}

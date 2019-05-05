import { Injectable } from '@angular/core';
import { EngineService } from '@app/lore/engine/engine.service';
import { Actor, ActorDelta, UnixWrapper } from '@app/model/data';
import { DatabaseService } from '@app/service/database.service';
import { ActorFormResultData } from '@lore/component';
import { StoreFacade } from '@lore/store/store-facade.service';
import moment from 'moment';
import { RxDocument } from 'rxdb';
import { combineLatest, from, Observable, Subject } from 'rxjs';
import { filter, map, mergeMap, shareReplay, switchMap, tap, toArray } from 'rxjs/operators';
import { LoreService } from './lore.service';

export interface ActorAccumulator {
	cursor: number;
	actor: RxDocument<Actor, {}>;
	accumulator: { name: string; maxSpeed: number; knowledge: Array<{ key: String; value: String }> };
}

@Injectable()
export class ActorService {
	public actorFormSave = new Subject<ActorFormResultData>();

	public constructor(
		private loreService: LoreService,
		private engineService: EngineService,
		private storeFacade: StoreFacade,
		private databaseService: DatabaseService
	) {}

	public actorDeltasAtCursor$: Observable<Array<ActorAccumulator>> = combineLatest([
		this.databaseService.currentLoreActors$,
		this.storeFacade.cursor$
	]).pipe(
		mergeMap(([actors, cursor]) =>
			from(actors).pipe(
				map(actor => {
					const accumulator = {
						name: undefined as string,
						maxSpeed: Actor.DEFAULT_MAX_SPEED,
						knowledge: []
					};
					const knowledgeMap = new Map<String, String>();
					for (const node of actor._states.nodes()) {
						if (node.key.unix > cursor) {
							break;
						}
						for (const [key, value] of node.value.knowledge.entries()) {
							if (value !== undefined) {
								knowledgeMap.set(key, value);
							}
						}
						if (node.value.name !== undefined) {
							accumulator.name = node.value.name;
						}
						if (node.value.maxSpeed !== undefined) {
							accumulator.maxSpeed = node.value.maxSpeed;
						}
					}
					for (const [key, value] of knowledgeMap.entries()) {
						accumulator.knowledge.push({ key, value });
					}
					return { cursor, actor, accumulator };
				}),
				toArray()
			)
		),
		shareReplay(1)
	);

	public selectedActorAccumulatorAtCursor$: Observable<ActorAccumulator> = combineLatest([
		this.actorDeltasAtCursor$,
		this.engineService.selected.pipe(
			filter(actorObject => actorObject !== undefined),
			map(actorObject => actorObject.actor)
		)
	]).pipe(
		map(([all, selected]) => all.find(acc => acc.actor.id === selected.id)),
		filter(delta => delta !== undefined)
	);

	public actorDialogSubscription = this.actorFormSave.pipe(
		filter(data => data !== undefined),
		switchMap(({ object, name, maxSpeed, date, time, knowledge, newKnowledge }) => {
			const wrapper = new UnixWrapper(moment(`${date}T${time}`).unix());
			const finalPosition = this.loreService.actorPositionAt(object.actor, wrapper.unix);
			const knowledgeMap = new Map();
			knowledge
				.filter(({ value }) => !!value)
				.map(k => {
					if (k.forget) {
						k.value = undefined;
					}
					return k;
				})
				.forEach(({ key, value }) => knowledgeMap.set(key, value));
			newKnowledge.filter(({ value }) => !!value).forEach(({ key, value }) => knowledgeMap.set(key, value));
			const delta = new ActorDelta(name ? name : undefined, finalPosition, knowledgeMap, maxSpeed);
			object.actor._states.set(wrapper, delta);
			return from(
				object.actor.atomicUpdate(actor => {
					actor._states = object.actor._states;
					return actor;
				})
			).pipe(map(actor => ({ actor, object })));
		}),
		tap(({ object }) => LoreService.refreshBlockOfActorObject(object))
	).subscribe();
}

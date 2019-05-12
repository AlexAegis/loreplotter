import { Enclosing, Node } from '@alexaegis/avl';
import { Injectable } from '@angular/core';
import { refreshBlockOfActorObject } from '@app/function/refresh-block-component.function';
import { EngineService } from '@app/lore/engine/engine.service';
import { Actor, ACTOR_DEFAULT_COLOR, ACTOR_DEFAULT_MAX_SPEED, ActorDelta } from '@app/model/data';
import { DatabaseService } from '@app/service/database.service';
import { ActorFormResultData } from '@lore/component';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDocument } from 'rxdb';
import { combineLatest, from, Observable, Subject } from 'rxjs';
import { filter, map, mergeMap, shareReplay, switchMap, tap, toArray } from 'rxjs/operators';
import { Group, Object3D, Quaternion, Vector3 } from 'three';

export interface ActorAccumulator {
	cursor: number;
	actor: RxDocument<Actor, {}>;
	accumulator: { name: string; maxSpeed: number; knowledge: Array<{ key: String; value: String }>; color: string };
}

@Injectable()
export class ActorService {
	public actorFormSave = new Subject<ActorFormResultData>();
	// best name ever
	public slerperHelper: Group;
	public latestSlerpsWorldPositionHolder: Vector3;
	public pseudoPoint: Group;

	public constructor(
		private engineService: EngineService,
		private storeFacade: StoreFacade,
		private databaseService: DatabaseService
	) {
		this.slerperHelper = new Group();
		this.pseudoPoint = new Group();
		this.pseudoPoint.position.set(0, 0, 1);
		this.slerperHelper.add(this.pseudoPoint);
		this.latestSlerpsWorldPositionHolder = new Vector3();
	}

	//public actorDeltasAtCursor$: Observable<Array<ActorAccumulator>> = combineLatest([
	//	this.databaseService.currentLoreActors$,
	//	this.storeFacade.cursor$
	//]).pipe(
	//	mergeMap(([actors, cursor]) =>
	//		from(actors).pipe(
	//			map(actor => {
	//				const accumulator = {
	//					name: undefined as string,
	//					maxSpeed: ACTOR_DEFAULT_MAX_SPEED,
	//					color: ACTOR_DEFAULT_COLOR,
	//					knowledge: []
	//				};
	//				const knowledgeMap = new Map<String, String>();
	//				for (const node of actor._states.nodes()) {
	//					if (node.key.unix > cursor) {
	//						break;
	//					}
	//					for (const [key, value] of node.value.knowledge.entries()) {
	//						if (value) {
	//							knowledgeMap.set(key, value);
	//						} else {
	//							knowledgeMap.delete(key);
	//						}
	//					}
	//					if (node.value.name !== undefined) {
	//						accumulator.name = node.value.name;
	//					}
	//					if (node.value.maxSpeed !== undefined) {
	//						accumulator.maxSpeed = node.value.maxSpeed;
	//					}
	//					if (node.value.color !== undefined) {
	//						accumulator.color = node.value.color;
	//					}
	//				}
	//				for (const [key, value] of knowledgeMap.entries()) {
	//					accumulator.knowledge.push({ key, value });
	//				}
	//				return { cursor, actor, accumulator };
	//			}),
	//			toArray()
	//		)
	//	),
	//	shareReplay(1)
	//);

	//public selectedActorAccumulatorAtCursor$: Observable<ActorAccumulator> = combineLatest([
	//	this.actorDeltasAtCursor$,
	//	this.engineService.selected.pipe(
	//		filter(actorObject => actorObject !== undefined),
	//		map(actorObject => actorObject.actor)
	//	)
	//]).pipe(
	//	map(([all, selected]) => all.find(acc => acc.actor.id === selected.id)),
	//	filter(delta => delta !== undefined)
	//);

	// public actorDialogSubscription = this.actorFormSave
	// 	.pipe(
	// 		filter(data => data !== undefined),
	// 		switchMap(({ object, name, maxSpeed, date, knowledge, newKnowledge, color }) => {
	// 			const wrapper = new UnixWrapper(date.unix());
	// 			const finalPosition = this.actorPositionAt(object.actor, wrapper.unix);
	// 			const knowledgeMap = new Map<String, String | undefined>();
	// 			knowledge
	// 				.map(k => {
	// 					if (k.forget) {
	// 						k.value = undefined;
	// 					}
	// 					return k;
	// 				})
	// 				.forEach(({ key, value }) => knowledgeMap.set(key, value));
	// 			newKnowledge.filter(({ value }) => !!value).forEach(({ key, value }) => knowledgeMap.set(key, value));
	// 			const delta = new ActorDelta(name ? name : undefined, finalPosition, knowledgeMap, maxSpeed, color);
	// 			object.actor._states.set(wrapper, delta);
	// 			return from(
	// 				object.actor.atomicUpdate(actor => {
	// 					actor._states = object.actor._states;
	// 					return actor;
	// 				})
	// 			).pipe(map(actor => ({ actor, object })));
	// 		}),
	// 		tap(({ object }) => refreshBlockOfActorObject(object))
	// 	)
	// 	.subscribe();

	// public actorPositionAt(actor: RxDocument<Actor>, unix: number): Vector3Serializable {
	// 	let finalPosition: Vector3Serializable;
	// 	const wrapper = new UnixWrapper(unix);
	// 	const enclosing = actor._states.enclosingNodes(wrapper);
	// 	if (enclosing.first === undefined || enclosing.last === undefined) {
	// 		let node = enclosing.first;
	// 		if (!node) {
	// 			node = enclosing.last;
	// 		}
	// 		finalPosition = {
	// 			x: node.value.position.x,
	// 			y: node.value.position.y,
	// 			z: node.value.position.z
	// 		};
	// 	} else {
	// 		const progress = enclosingProgress(enclosing, unix);
	// 		const worldPos = this.lookAtInterpolated(enclosing, progress);
	// 		finalPosition = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
	// 	}
	// 	return finalPosition;
	// }

	/**
	 * rotates the position t'th way between the enclosure
	 * Returns a new worldpositon at radius 1
	 */
	// public lookAtInterpolated(
	// 	enclosure: Enclosing<Node<UnixWrapper, ActorDelta>>,
	// 	t: number,
	// 	o: Object3D = this.slerperHelper
	// ): Vector3 {
	// 	o.lookAt(enclosure.last.v.position.x, enclosure.last.v.position.y, enclosure.last.v.position.z);
	// 	o.applyQuaternion(this.engineService.globe.quaternion);
	// 	const fromQ = o.quaternion.clone();
	// 	o.lookAt(enclosure.first.v.position.x, enclosure.first.v.position.y, enclosure.first.v.position.z);
	// 	o.applyQuaternion(this.engineService.globe.quaternion); // if the globe is rotated (it's not) then account it
	// 	const toQ = o.quaternion.clone();
	// 	if (t && Math.abs(t) !== Infinity) {
	// 		Quaternion.slerp(fromQ, toQ, o.quaternion, t);
	// 		o.updateWorldMatrix(false, true); // The childrens worldpositions won't update unless I call this
	// 	}
	// 	return o.children.length > 0 && o.children[0].getWorldPosition(this.latestSlerpsWorldPositionHolder);
	// }

	// public accumulatorOf(actor: RxDocument<Actor>): Observable<ActorAccumulator> {
	// 	return this.actorDeltasAtCursor$.pipe(
	// 		map(actorAccs => actorAccs.find(actorAcc => actorAcc.actor.id === actor.id)),
	// 		filter(accumulator => accumulator !== undefined)
	// 	);
	// }
}

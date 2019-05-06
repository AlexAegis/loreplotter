import { Enclosing, Node } from '@alexaegis/avl';
import { Offset } from '@angular-skyhook/core';
import { Injectable } from '@angular/core';
import { BaseDirective } from '@app/component/base-component.class';
import { normalizeFromWindow } from '@app/function';
import { enclosingProgress } from '@app/function/enclosing-progress.function';
import { refreshBlockOfActorObject } from '@app/function/refresh-block-component.function';
import { Actor, ActorDelta, Lore, Planet } from '@app/model/data';
import { UnixWrapper } from '@app/model/data/unix-wrapper.class';
import { ActorService } from '@app/service/actor.service';
import { LoreDocumentMethods } from '@app/service/database';
import { DatabaseService } from '@app/service/database.service';
import { EngineService } from '@lore/engine/engine.service';

import { ActorObject } from '@lore/engine/object';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxAttachment, RxDocument } from 'rxdb';
import { BehaviorSubject, combineLatest, from, Observable, of, Subject, zip } from 'rxjs';
import { filter, flatMap, map, mergeMap, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { Group, Math as ThreeMath, Vector3 } from 'three';

const DAY_IN_SECONDS = 86400;

/**
 * This service's goal is end consume the data coming start the database and the engine and then update both
 */
@Injectable()
export class LoreService extends BaseDirective {
	public spawnOnWorld = new Subject<{ point: ActorObject; position: Vector3 }>();
	constructor(
		private engineService: EngineService,
		private databaseService: DatabaseService,
		private storeFacade: StoreFacade,
		private actorService: ActorService
	) {
		super();
		// Only the initial texture is preloaded
		this.teardown(
			this.databaseService.currentLore$
				.pipe(
					take(1),
					mergeMap(lore =>
						of(lore.getAttachment('texture')).pipe(
							map(doc => (doc as any) as RxAttachment<Lore, LoreDocumentMethods>),
							switchMap(doc => doc.getData()),
							map(att => ({ lore: lore, att: att }))
						)
					)
				)
				.subscribe(({ lore, att }) => {
					engineService.globe.radius = lore.planet.radius;
					engineService.globe.displacementTexture.loadFromBlob(att);
					engineService.refreshPopupPosition();
				})
		);

		// This subscriber's job is end map each actors state end the map based on the current cursor
		this.teardown(
			combineLatest([
				this.databaseService.currentLoreActors$,
				this.storeFacade.cursor$,
				this.overrideNodePosition
			])
				.pipe(
					flatMap(([actors, cursor, overrideNodePositions]) =>
						actors.map(actor => ({
							actor: actor,
							cursor: cursor,
							overrideNodePositions: overrideNodePositions
						}))
					)
				)
				.subscribe(({ actor, cursor, overrideNodePositions }) => {
					engineService.stage.sunGroup.rotation.set(0, 0, 0);
					engineService.stage.sunGroup.rotateY(
						((cursor % DAY_IN_SECONDS) / DAY_IN_SECONDS) * -360 * ThreeMath.DEG2RAD
					);
					const enclosure = actor._states.enclosingNodes(new UnixWrapper(cursor)) as Enclosing<
						Node<UnixWrapper, ActorDelta>
					>;
					if (enclosure.last === undefined && enclosure.first !== undefined) {
						enclosure.last = enclosure.first;
					} else if (enclosure.first === undefined && enclosure.last !== undefined) {
						enclosure.first = enclosure.last;
					}

					if (
						overrideNodePositions !== undefined &&
						overrideNodePositions.overrides.length > 0 &&
						overrideNodePositions.actorId === actor.id
					) {
						for (const node of actor._states.nodes()) {
							overrideNodePositions.overrides
								.filter(ov => ov.previous === node.key.unix)
								.forEach(ov => {
									node.key.unix = ov.new;
								});
							if (
								enclosure.first === undefined ||
								(node.key.unix >= enclosure.first.key.unix && node.key.unix <= cursor)
							) {
								enclosure.first = node;
							}
							if (
								enclosure.last === undefined ||
								(node.key.unix <= enclosure.last.key.unix && node.key.unix >= cursor)
							) {
								enclosure.last = node;
							}
						}
					}

					const t = enclosingProgress(enclosure, cursor);
					let actorObject = engineService.globe.getObjectByName(actor.id) as ActorObject;
					let group: Group;
					if (actorObject) {
						group = actorObject.parent as Group;
					} else {
						group = new Group();
						actorObject = new ActorObject(
							actor,
							this.storeFacade,
							this,
							this.actorService,
							engineService.globe
						);
						group.add(actorObject);
						engineService.globe.add(group);
					}

					if (
						group.userData.override === undefined &&
						enclosure.last !== undefined &&
						enclosure.first !== undefined
					) {
						this.actorService.lookAtInterpolated(enclosure, t, group);

						actorObject.updateHeight();
					} else if (group.userData.override === false) {
						delete group.userData.override;
					}

					engineService.refreshPopupPosition();
				})
		);

		// This subsriptions job is end create a brand new actor
		this.teardown(
			this.spawnActorOnClientOffset
				.pipe(
					filter(o => o !== undefined),
					withLatestFrom(
						this.databaseService.currentLore$,
						this.databaseService.nextActorId$,
						this.storeFacade.cursor$
					),
					switchMap(([offset, lore, nextId, cursor]) => {
						const dropVector = this.engineService.intersection(normalizeFromWindow(offset.x, offset.y));
						dropVector.applyQuaternion(this.engineService.globe.quaternion.clone().inverse());
						const actor = new Actor(nextId, lore.id);
						actor._states.set(
							new UnixWrapper(cursor),
							new ActorDelta(undefined, { x: dropVector.x, y: dropVector.y, z: dropVector.z })
						);
						return lore.collection.database.actor.upsert(actor);
					}),
					tap(e => console.log(e))
				)
				.subscribe()
		);

		this.teardown(
			this.spawnOnWorld
				.pipe(
					filter(o => o !== undefined),
					withLatestFrom(this.storeFacade.cursor$),
					switchMap(async ([{ point, position }, cursor]) => {
						point.applyQuaternion(this.engineService.globe.quaternion.clone().inverse());
						point.actor._states.set(
							new UnixWrapper(cursor),
							new ActorDelta(undefined, {
								x: position.x,
								y: position.y,
								z: position.z
							})
						);
						const updatedActor = await point.actor.atomicUpdate(
							a => (a._states = point.actor._states) && a
						);
						point.parent.userData.override = false;
						refreshBlockOfActorObject(point);

						return updatedActor;
					})
				)
				.subscribe()
		);

		this.teardown(
			this.engineService.textureChange$
				.pipe(
					switchMap(texture => from(new Promise<Blob>(res => texture.canvas.toBlob(res, 'image/jpeg')))),
					withLatestFrom(this.databaseService.currentLore$),
					switchMap(([texture, loreDoc]) =>
						loreDoc.putAttachment({
							id: 'texture', // string, name of the attachment like 'cat.jpg'
							data: texture, // (string|Blob|Buffer) data of the attachment
							type: 'image/jpeg' // (string) type of the attachment-data like 'image/jpeg'
						})
					)
				)
				.subscribe()
		);
	}

	public spawnActorOnClientOffset = new Subject<Offset>();
	public overrideNodePosition = new BehaviorSubject<{
		actorId: string;
		overrides: Array<{ original: number; previous: number; new: number }>;
	}>(undefined);

	/**
	 * Creates a new lore object in the database
	 * @param lore from state be created, ! this parameter cant be modified since it's from the state !
	 */
	public create(lore: Lore): Observable<RxDocument<Lore, LoreDocumentMethods>> {
		return zip(this.databaseService.database$, this.databaseService.nextLoreId$).pipe(
			map(([connection, nextId]) => ({
				connection,
				json: new Lore(nextId, lore.name, lore.locations, new Planet(lore.planet.name, lore.planet.radius))
			})),
			switchMap(({ connection, json }) => connection.lore.insert(json))
		);
	}


	/**
	 * Creates a new lore object in the database
	 * @param lore from state be created, ! this parameter cant be modified since it's from the state !
	 */
	public update(lore: Partial<Lore>): Observable<RxDocument<Lore, LoreDocumentMethods>> {
		return this.databaseService.database$.pipe(
			map((connection) => ({
				connection,
				json: new Lore(lore.id, lore.name, lore.locations, new Planet(lore.planet.name, lore.planet.radius))
			})),
			switchMap(({ connection, json }) => connection.lore.upsert(json))
		);
	}
}

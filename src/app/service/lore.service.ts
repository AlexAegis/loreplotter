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
import { Axis } from '@lore/engine/helper';

import { ActorObject } from '@lore/engine/object';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxAttachment, RxDocument } from 'rxdb';
import { BehaviorSubject, combineLatest, from, Observable, Subject, zip } from 'rxjs';
import { filter, flatMap, map, mergeMap, switchMap, withLatestFrom } from 'rxjs/operators';
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
		// This subscription makes sure that always the current texture is shown
		this.teardown(
			this.databaseService.currentLore$
				.pipe(
					mergeMap(lore =>
						lore.allAttachments$.pipe(
							flatMap(attachments => attachments),
							filter(attachment => attachment.id === 'texture'),
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
		this.teardown(
			this.storeFacade.cursor$
				.pipe(
					filter(
						cursor =>
							this.engineService.stage !== undefined && this.engineService.stage.sun !== undefined
					)
				)
				.subscribe(cursor => {
					this.engineService.stage.sun.resetPosition();
					this.engineService.stage.sun.position.applyAxisAngle(Axis.y,
						((cursor % DAY_IN_SECONDS) / DAY_IN_SECONDS) * -360 * ThreeMath.DEG2RAD
					);
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
					flatMap(([actors, cursor, overrides]) =>
						actors.map(actor => ({
							actor: actor,
							cursor: cursor,
							overrideNodePositions: (overrides && actor.id === overrides.actorId ? overrides : undefined)
						}))
					)
				)
				.subscribe(({ actor, cursor, overrideNodePositions }) => {
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
						overrideNodePositions.overrides.length > 0
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
					let actorObject = this.engineService.globe.getObjectByName(actor.id) as ActorObject;
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
						this.engineService.globe.add(group);

						this.engineService.control.zoomUpdate(this.engineService.stage.camera.position.length());
						actorObject.updateHeightAndWorldPosAndScale();
					}

					if (
						group.userData.override === undefined &&
						enclosure.last !== undefined &&
						enclosure.first !== undefined
					) {
						this.actorService.lookAtInterpolated(enclosure.last.value.position, enclosure.first.value.position, t, group);

						actorObject.updateHeight();
					} else if (group.userData.override === false) {
						delete group.userData.override;
					}

					engineService.refreshPopupPosition();
				})
		);

		// This subscriptions job is end create a brand new actor
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
					})
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
			map(connection => ({
				connection,
				json: new Lore(lore.id, lore.name, lore.locations, new Planet(lore.planet.name, lore.planet.radius))
			})),
			switchMap(({ connection, json }) => connection.lore.upsert(json))
		);
	}

	/**
	 * Deletes a lore object from the database and also all the actors
	 * @param id of the lore to be deleted
	 */
	public delete(id: string): Observable<boolean> {
		return this.databaseService.database$.pipe(
			switchMap(connection =>
				connection.lore
					.find({ id: id })
					.$.pipe(
						mergeMap(lores =>
							connection.actor.find({ loreId: id }).$.pipe(map(actors => ({ lores, actors })))
						)
					)
			),
			mergeMap(({ lores, actors }) =>
				zip(from(lores).pipe(switchMap(l => l.remove())), from(actors).pipe(switchMap(a => a.remove())))
			),
			map(([l, a]) => l || a)
		);
	}
}

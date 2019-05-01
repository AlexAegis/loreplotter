import { Enclosing, Node } from '@alexaegis/avl';
import { Offset } from '@angular-skyhook/core';
import { Injectable } from '@angular/core';
import moment from 'moment';
import { BehaviorSubject, combineLatest, timer, from, Subject, of, range, Observable } from 'rxjs';
import {
	filter,
	flatMap,
	takeUntil,
	switchMap,
	withLatestFrom,
	tap,
	take,
	map,
	mergeMap,
	shareReplay,
	scan,
	debounceTime,
	distinctUntilChanged
} from 'rxjs/operators';
import { DatabaseService } from '@app/service/database.service';
import { Group, Quaternion, Vector3, Object3D } from 'three';

import { ActorObject } from '@lore/engine/object';
import { Actor, Lore, ActorDelta, Vector3Serializable } from '@app/model/data';
import { UnixWrapper } from '@app/model/data/unix-wrapper.class';
import { CursorComponent, ActorFormResultData } from '@lore/component';
import { EngineService } from '@lore/engine/engine.service';
import {Math as ThreeMath} from 'three';
import { RxAttachment, RxDocument } from 'rxdb';
import { LoreDocumentMethods } from '@app/service/database';
import { normalizeFromWindow } from '@app/function';

const DAY_IN_SECONDS = 86400;

/**
 * This service's goal is to consume the data coming from the database and the engine and then update both
 */
@Injectable()
export class LoreService {
	// best name ever
	public slerperHelper: Group;
	public pseudoPoint: Group;
	public latestSlerpsWorldPositionHolder: Vector3;
	constructor(private engineService: EngineService, private databaseService: DatabaseService) {
		console.log(this);

		this.slerperHelper = new Group();
		this.pseudoPoint = new Group();
		this.pseudoPoint.position.set(0, 0, 1);
		this.slerperHelper.add(this.pseudoPoint);
		this.latestSlerpsWorldPositionHolder = new Vector3();
		// Only the initial texture is preloaded
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
			});

		// This subscriber's job is to map each actors state to the map based on the current cursor
		combineLatest([this.databaseService.currentLoreActors$, this.cursor$, this.overrideNodePosition])
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

				const t = this.progress(enclosure, cursor);
				let actorObject = engineService.globe.getObjectByName(actor.id) as ActorObject;
				let group: Group;
				if (actorObject) {
					group = actorObject.parent as Group;
				} else {
					group = new Group();
					actorObject = new ActorObject(actor);
					group.add(actorObject);
					engineService.globe.add(group);
				}

				if (
					group.userData.override === undefined &&
					enclosure.last !== undefined &&
					enclosure.first !== undefined
				) {
					this.lookAtInterpolated(enclosure, t, group);

					actorObject.updateHeight();
				} else if (group.userData.override === false) {
					delete group.userData.override;
				}

				engineService.refreshPopupPosition();
			});

		// This subsriptions job is to create a brand new actor
		this.spawnActorOnClientOffset
			.pipe(
				filter(o => o !== undefined),
				withLatestFrom(this.databaseService.currentLore$, this.databaseService.nextActorId$, this.cursor),
				switchMap(([offset, lore, nextId, cursor]) => {
					const dropVector = this.engineService.intersection(normalizeFromWindow(offset.x, offset.y));
					dropVector.applyQuaternion(this.engineService.globe.quaternion.clone().inverse());
					const actor = new Actor(nextId, lore.name);
					actor._states.set(
						new UnixWrapper(cursor),
						new ActorDelta(undefined, { x: dropVector.x, y: dropVector.y, z: dropVector.z })
					);

					return lore.collection.database.actor.insert(actor);
				})
			)
			.subscribe();

		this.engineService.spawnOnWorld
			.pipe(
				filter(o => o !== undefined),
				withLatestFrom(this.cursor),
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
					const updatedActor = await point.actor.atomicUpdate(a => (a._states = point.actor._states) && a);
					point.parent.userData.override = false;
					this.refreshBlockOfActorObject(point);

					return updatedActor;
				})
			)
			.subscribe();

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
			.subscribe();

		this.saveActorDelta
			.pipe(
				switchMap(({ object, name, date, time, knowledge, newKnowledge }) => {
					const wrapper = new UnixWrapper(moment(`${date}T${time}`).unix());
					const finalPosition = this.actorPositionAt(object.actor, wrapper.unix);
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
					newKnowledge
						.filter(({ value }) => !!value)
						.forEach(({ key, value }) => knowledgeMap.set(key, value));
					const delta = new ActorDelta(name ? name : undefined, finalPosition, knowledgeMap);
					object.actor._states.set(wrapper, delta);
					return from(
						object.actor.atomicUpdate(actor => {
							actor._states = object.actor._states;
							return actor;
						})
					).pipe(map(actor => ({ actor, object })));
				}),
				tap(({ object }) => this.refreshBlockOfActorObject(object))
			)
			.subscribe();
	}

	public cursor = new BehaviorSubject<number>(moment('2019-01-03T12:00:00').unix()); // Unix
	public overrideCursor = new BehaviorSubject<number>(undefined);
	public cursor$ = combineLatest([this.cursor, this.overrideCursor]).pipe(
		map(([c, oc]) => (oc ? oc : c)),
		scan(
			(
				accumulator: { current: number; avg: number; dampenedSpeed: number; cache: Array<number> },
				next: number
			) => {
				accumulator.cache.push(Math.abs(accumulator.current - next));
				if (accumulator.cache.length > 20) {
					accumulator.cache.shift();
				}
				const nextAvg = accumulator.cache.reduce((a, n) => a + n) / accumulator.cache.length;
				accumulator.dampenedSpeed = Math.abs(nextAvg - accumulator.avg);
				accumulator.avg = nextAvg;
				accumulator.current = next;
				return accumulator;
			},
			{ current: this.cursor.value, avg: this.cursor.value, dampenedSpeed: 0, cache: [0] }
		),
		tap(({ avg }) => this.engineService.dampenedSpeed.next(avg)),
		map(({ current }) => current),
		shareReplay(1)
	);

	public cursorDampener$ = this.cursor$
		.pipe(
			distinctUntilChanged(),
			debounceTime(1000 / 45),
			mergeMap(val =>
				range(1, 20).pipe(
					take(20),
					map(i => val)
				)
			)
		)
		.subscribe(next => this.cursor.next(next));

	public spawnActorOnClientOffset = new Subject<Offset>();
	public saveActorDelta = new Subject<ActorFormResultData>();
	public overrideNodePosition = new BehaviorSubject<{
		actorId: string;
		overrides: Array<{ original: number; previous: number; new: number }>;
	}>(undefined);

	public stopSubject = new BehaviorSubject<boolean>(false);

	public autoFrameShift$ = new Subject<number>();

	public actorPositionAt(actor: RxDocument<Actor>, unix: number): Vector3Serializable {
		let finalPosition: Vector3Serializable;
		const wrapper = new UnixWrapper(unix);
		const enclosing = actor._states.enclosingNodes(wrapper);
		if (enclosing.first === undefined || enclosing.last === undefined) {
			let node = enclosing.first;
			if (!node) {
				node = enclosing.last;
			}
			finalPosition = {
				x: node.value.position.x,
				y: node.value.position.y,
				z: node.value.position.z
			};
		} else {
			const progress = this.progress(enclosing, unix);
			const worldPos = this.lookAtInterpolated(enclosing, progress);
			finalPosition = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
		}
		return finalPosition;
	}

	/**
	 * atm, make this a pipe, also do one for color
	 */
	public name(actor: Actor) {
		return actor.id;
	}

	public play(cursorComponent: CursorComponent) {
		this.stopSubject.next(false);
		timer(0, 1000 / 60)
			.pipe(
				takeUntil(this.stopSubject.pipe(filter(val => val))),
				filter(i => !this.overrideCursor.value),
				map(i => ({ cursor: this.cursor.value, speed: this.engineService.speed.value }))
			)
			.subscribe(({ cursor, speed }) => {
				this.cursor.next(cursor + speed);
				cursorComponent.contextChange();
				if (speed > 0 && cursorComponent.progress > 0.8) {
					this.autoFrameShift$.next(1);
					// jump forward with the frame
				} else if (speed < 0 && cursorComponent.progress < 0.2) {
					// jump backward with the frame
					this.autoFrameShift$.next(-1);
				}
			});
	}

	/**
	 * rotates the position t'th way between the enclosure
	 * Returns a new worldpositon at radius 1
	 */
	public lookAtInterpolated(
		enclosure: Enclosing<Node<UnixWrapper, ActorDelta>>,
		t: number,
		o: Object3D = this.slerperHelper
	): Vector3 {
		o.lookAt(enclosure.last.v.position.x, enclosure.last.v.position.y, enclosure.last.v.position.z);
		o.applyQuaternion(this.engineService.globe.quaternion);
		const fromQ = o.quaternion.clone();
		o.lookAt(enclosure.first.v.position.x, enclosure.first.v.position.y, enclosure.first.v.position.z);
		o.applyQuaternion(this.engineService.globe.quaternion); // if the globe is rotated (it's not) then account it
		const toQ = o.quaternion.clone();
		if (t && Math.abs(t) !== Infinity) {
			Quaternion.slerp(fromQ, toQ, o.quaternion, t);
			o.updateWorldMatrix(false, true); // The childrens worldpositions won't update unless I call this
		}
		return o.children.length > 0 && o.children[0].getWorldPosition(this.latestSlerpsWorldPositionHolder);
	}

	public progress(enclosure: Enclosing<Node<UnixWrapper, ActorDelta>>, unix: number) {
		return ThreeMath.mapLinear(
			unix,
			enclosure.last ? enclosure.last.k.unix : -Infinity,
			enclosure.first ? enclosure.first.k.unix : Infinity,
			0,
			1
		);
	}

	public refreshBlockOfActorObject(actorObject: ActorObject): void {
		if (actorObject.actor._userdata && actorObject.actor._userdata.block) {
			const b = actorObject.actor._userdata.block;
			b.blockStart.original = b.blockStart.override = actorObject.actor._states.first().key.unix;
			b.blockEnd.original = b.blockEnd.override = actorObject.actor._states.last().key.unix;
			b.update();
		}
	}

	/**
	 * Creates a new lore object in the database
	 * TODO: Refactor this service and move the non data-manipulating methods somewhere else
	 * @param lore to be created
	 */
	public create(lore: Lore): Observable<RxDocument<Lore, LoreDocumentMethods>> {
	console.log('create in serviccce');
		// return of(lore as any).pipe(tap(e => console.log('TAPPED INTOI!!')), tap(e => console.log(e)));
		return this.databaseService.database$.pipe(switchMap(connection => {
			console.log('issuing insert of lore object in the lore service');
			console.log(lore);
			return connection.lore.insert(lore);
		}));
	}
}

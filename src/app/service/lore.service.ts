import { Axis } from './../engine/helper/axis.class';
import { Enclosing, Node } from '@alexaegis/avl';
import { Offset } from '@angular-skyhook/core';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest, interval } from 'rxjs';
import { filter, flatMap, takeUntil, switchMap, withLatestFrom, tap, take } from 'rxjs/operators';
import { DatabaseService } from 'src/app/database/database.service';
import { Group, Quaternion, Vector3 } from 'three';

import { clamp } from '../engine/helper/clamp.function';
import { normalize } from '../engine/helper/normalize.function';
import { Point } from '../engine/object/point.class';
import { Actor } from '../model/actor.class';
import { UnixWrapper } from '../model/unix-wrapper.class';
import { CursorComponent } from './../component/cursor/cursor.component';
import { EngineService } from './../engine/engine.service';
import { ActorDelta } from './../model/actor-delta.class';
import { TextureDelta } from '../model/texture-delta.class';
import * as THREE from 'three';
import { Globe } from '../engine/object/globe.class';

const DAY_IN_SECONDS = 86400;
/**
 * This service's goal is to consume the data comint from the database and the engine and then update both
 */
@Injectable({
	providedIn: 'root'
})
export class LoreService {
	constructor(private engineService: EngineService, private databaseService: DatabaseService) {
		/** Only the initial texture is preloaded */
		this.databaseService.currentLore.pipe(take(1)).subscribe(lore => {
			engineService.globe.radius = lore.planet.radius;
			engineService.globe.displacementTexture.loadFromDataURL(lore.planet.displacementTexture);
			engineService.globe.changed();
		});

		// This subscriber's job is to map each actors state to the map based on the current cursor
		combineLatest(this.databaseService.actors$, this.cursor$, this.overrideNodePosition$)
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
				engineService.selected.next(undefined);
				engineService.stage.sunGroup.rotation.set(0, 0, 0);
				engineService.stage.sunGroup.rotateY(
					((cursor % DAY_IN_SECONDS) / DAY_IN_SECONDS) * 360 * THREE.Math.DEG2RAD
				);
				engineService.stage.pseudoSunGroup.getWorldPosition(engineService.stage.sun.position);

				const enclosure = actor.states.enclosingNodes(new UnixWrapper(cursor)) as Enclosing<
					Node<UnixWrapper, ActorDelta>
				>;
				if (enclosure.last === undefined && enclosure.first !== undefined) {
					enclosure.last = enclosure.first;
				} else if (enclosure.first === undefined && enclosure.last !== undefined) {
					enclosure.first = enclosure.last;
				}

				if (overrideNodePositions !== undefined && overrideNodePositions.actorId === actor.id) {
					for (const node of actor.states.nodes()) {
						overrideNodePositions.overrides
							.filter(ov => ov.previous === node.key.unix)
							.forEach(ov => {
								node.key.unix = ov.new;
							});
						if (node.key.unix >= enclosure.first.key.unix && node.key.unix <= cursor) {
							enclosure.first = node;
						}
						if (node.key.unix <= enclosure.last.key.unix && node.key.unix >= cursor) {
							enclosure.last = node;
						}
					}
				}
				const t = THREE.Math.mapLinear(cursor, enclosure.last.k.unix, enclosure.first.k.unix, 0, 1);

				let actorObject = engineService.globe.getObjectByName(actor.id) as Point;
				let group: Group;
				if (actorObject) {
					group = actorObject.parent as Group;
				} else {
					group = new Group();
					actorObject = new Point(actor.id);
					group.add(actorObject);
					engineService.globe.add(group);
				}

				if (group.userData.override === undefined) {
					const lastVec = new Vector3(
						enclosure.last.v.position.x,
						enclosure.last.v.position.y,
						enclosure.last.v.position.z
					);

					const firstVec = new Vector3(
						enclosure.first.v.position.x,
						enclosure.first.v.position.y,
						enclosure.first.v.position.z
					);

					group.lookAt(lastVec);
					group.applyQuaternion(engineService.globe.quaternion);
					const fromQ = group.quaternion.clone();
					group.lookAt(firstVec);
					group.applyQuaternion(engineService.globe.quaternion);
					const toQ = group.quaternion.clone();
					if (t && Math.abs(t) !== Infinity) {
						Quaternion.slerp(fromQ, toQ, group.quaternion, t);
						group.updateWorldMatrix(false, true); // The childrens worldpositions won't update unless I call this
					}
					actorObject.updateHeight();
				} else if (group.userData.override === false) {
					delete group.userData.override;
				}
			});

		// This subsriptions job is to
		this.spawnOnClientOffset$
			.pipe(
				filter(o => o !== undefined),
				withLatestFrom(this.databaseService.currentLore, this.cursor$)
			)
			.subscribe(([offset, lore, cursor]) => {
				const dropVector = this.engineService.intersection(normalize(offset.x, offset.y));
				dropVector.applyQuaternion(this.engineService.globe.quaternion.clone().inverse());
				const actor = new Actor(lore.nextId());
				actor.states.set(
					new UnixWrapper(cursor),
					new ActorDelta(undefined, { x: dropVector.x, y: dropVector.y, z: dropVector.z })
				);
				lore.atomicUpdate(l => {
					l.actors.push(actor);
					return l;
				});
			});

		this.engineService.spawnOnWorld$
			.pipe(
				filter(o => o !== undefined),
				withLatestFrom(this.databaseService.currentLore, this.cursor$)
			)
			.subscribe(([{ object, point }, lore, cursor]) => {
				point.applyQuaternion(this.engineService.globe.quaternion.clone().inverse());
				lore.atomicUpdate(l => {
					l.actors
						.filter(a => a.id === object.name)
						.map(this.databaseService.actorStateMapper)
						.forEach(actor => {
							actor.states.set(
								new UnixWrapper(cursor),
								new ActorDelta(undefined, {
									x: point.x,
									y: point.y,
									z: point.z
								})
							);
						});
					return l;
				}).finally(() => {
					object.parent.userData.override = false;
				});
			});

		this.engineService.textureChange$
			.pipe(
				withLatestFrom(this.databaseService.currentLore, this.cursor$),
				switchMap(([texture, loreDoc, cursor]) => {
					return loreDoc.atomicUpdate(lore => {
						lore.planet.displacementTexture = texture.canvas.toDataURL();
						return lore;
					});
				})
			)
			.subscribe();
	}

	public cursor$ = new BehaviorSubject<number>(moment('2019-01-03T01:10:00').unix()); // Unix
	public spawnOnClientOffset$ = new BehaviorSubject<Offset>(undefined);
	public overrideNodePosition$ = new BehaviorSubject<{
		actorId: string;
		overrides: Array<{ original: number; previous: number; new: number }>;
	}>(undefined);

	public stopSubject = new BehaviorSubject<boolean>(false);

	public name(actor: Actor) {
		return actor.id;
	}

	public play(cursor: CursorComponent) {
		this.stopSubject.next(false);
		interval(1000 / 60)
			.pipe(takeUntil(this.stopSubject.pipe(filter(val => val))))
			.subscribe(i => {
				this.cursor$.next(this.cursor$.value + 3600 / 6);
				cursor.contextChange();
			});
	}
}

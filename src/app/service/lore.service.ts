import { ActorDelta } from './../model/actor-delta.class';
import { Quaternion, Group, Vector3 } from 'three';
import { DatabaseService } from 'src/app/database/database.service';
import { EngineService } from './../engine/engine.service';
import { Injectable } from '@angular/core';
import { Moment } from 'moment';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest, merge } from 'rxjs';
import { rescale } from '../misc/rescale.function';
import { UnixWrapper } from '../model/unix-wrapper.class';
import { Point } from '../engine/object/point.class';
import { Enclosing, Node } from '@alexaegis/avl';
import { invert } from '../engine/helper/invert.function';
import { flatMap, filter, mergeAll, withLatestFrom, map, tap } from 'rxjs/operators';
import { Offset } from '@angular-skyhook/core';
import { Actor } from '../model/actor.class';
import { normalize } from '../engine/helper/normalize.function';

/**
 * This service's goal is to consume the data comint from the database and the engine and then update both
 */
@Injectable({
	providedIn: 'root'
})
export class LoreService {
	public cursor$ = new BehaviorSubject<number>(moment('2019-01-03T01:10:00').unix()); // Unix
	public spawnOnClientOffset$ = new BehaviorSubject<Offset>(undefined);

	constructor(private engineService: EngineService, private databaseService: DatabaseService) {
		// This subscriber's job is to map each actors state to the map based on the current cursor
		combineLatest(databaseService.actors$(), this.cursor$)
			.pipe(flatMap(([actors, cursor]) => actors.map(actor => ({ actor: actor, cursor: cursor }))))
			.subscribe(({ actor, cursor }) => {
				engineService.selected.next(undefined);
				engineService.globe.changed();
				const enclosure = actor.states.enclosingNodes(new UnixWrapper(cursor)) as Enclosing<
					Node<UnixWrapper, ActorDelta>
				>;
				if (enclosure.last === undefined && enclosure.first !== undefined) {
					enclosure.last = enclosure.first;
				} else if (enclosure.first === undefined && enclosure.last !== undefined) {
					enclosure.first = enclosure.last;
				}
				const t = rescale(cursor, enclosure.last.k.unix, enclosure.first.k.unix, 0, 1);
				const actorObject = engineService.globe.getObjectByName(actor.id);
				let group: Group;
				if (actorObject) {
					group = actorObject.parent as Group;
				} else {
					group = new Group();
					group.add(new Point(actor.id));
					engineService.globe.add(group);
				}
				group.lookAt(
					new Vector3(enclosure.last.v.position.x, enclosure.last.v.position.y, enclosure.last.v.position.z)
				);
				group.applyQuaternion(engineService.globe.quaternion);
				const fromQ = group.quaternion.clone();
				group.lookAt(
					new Vector3(
						enclosure.first.v.position.x,
						enclosure.first.v.position.y,
						enclosure.first.v.position.z
					)
				);
				group.applyQuaternion(engineService.globe.quaternion);
				const toQ = group.quaternion.clone();
				if (t && Math.abs(t) !== Infinity) {
					Quaternion.slerp(fromQ, toQ, group.quaternion, t);
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
							console.log(actor);
							console.log(object);
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
				});
			});
	}
}

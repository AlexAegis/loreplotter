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
import { flatMap, filter, mergeAll, withLatestFrom } from 'rxjs/operators';
import { Offset } from '@angular-skyhook/core';
import { Actor } from '../model/actor.class';
import { normalize } from '../engine/helper/normalize.function';
@Injectable({
	providedIn: 'root'
})
export class LoreService {
	public cursor$ = new BehaviorSubject<Moment>(moment('2019-01-03T01:10:00'));
	public monitor$ = new BehaviorSubject<Offset>(undefined);

	constructor(private engineService: EngineService, private databaseService: DatabaseService) {
		combineLatest(databaseService.actors$().pipe(flatMap(actors => actors)), this.cursor$).subscribe(
			([actor, cursor]) => {
				const enclosure = actor.states.enclosingNodes(new UnixWrapper(cursor.unix())) as Enclosing<
					Node<UnixWrapper, ActorDelta>
				>;
				if (enclosure.last === undefined && enclosure.first !== undefined) {
					enclosure.last = enclosure.first;
				} else if (enclosure.first === undefined && enclosure.last !== undefined) {
					enclosure.first = enclosure.last;
				}
				if (enclosure.first && enclosure.last) {
					console.log(
						`cursor.unix(): ${cursor.unix()} enclosure.last.k ${enclosure.last.k.unix} enclosure.first.k: ${
							enclosure.first.k.unix
						}`
					);
					const t = rescale(cursor.unix(), enclosure.last.k.unix, enclosure.first.k.unix, 0, 1);
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
						new Vector3(
							enclosure.last.v.position.x,
							enclosure.last.v.position.y,
							enclosure.last.v.position.z
						)
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
					if (t) {
						Quaternion.slerp(fromQ, toQ, group.quaternion, t);
					}
				}
			}
		);
		this.monitor$
			.pipe(
				filter(o => o !== undefined),
				withLatestFrom(this.databaseService.currentLore, this.cursor$)
			)
			.subscribe(([offset, lore, cursor]) => {
				// lore.nextId();
				console.log('getClientOffset' + offset);
				console.log(offset);
				const dropVector = this.engineService.intersection(normalize(offset.x, offset.y));

				if (dropVector) {
					dropVector.applyQuaternion(this.engineService.globe.quaternion.clone().inverse());
					const actor = new Actor(lore.nextId());
					actor.states.set(
						new UnixWrapper(cursor.unix()),
						new ActorDelta(undefined, { x: dropVector.x, y: dropVector.y, z: dropVector.z })
					);
					lore.atomicUpdate(l => {
						l.actors.push(actor);
						return l;
					});
				}
			});
	}
}

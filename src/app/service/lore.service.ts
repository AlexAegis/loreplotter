import { ActorDelta } from './../model/actor-delta.class';
import { Quaternion, Group } from 'three';
import { DatabaseService } from 'src/app/database/database.service';
import { EngineService } from './../engine/engine.service';
import { Injectable } from '@angular/core';
import { Moment } from 'moment';
import * as moment from 'moment';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { normalize } from '../misc/normalize.function';
import { UnixWrapper } from '../model/unix-wrapper.class';
import { Point } from '../engine/object/point.class';
import { Enclosing, Node } from '@alexaegis/avl';

@Injectable({
	providedIn: 'root'
})
export class LoreService {
	public cursor$ = new BehaviorSubject<Moment>(moment('2019-01-03T01:10:00'));

	constructor(private engineService: EngineService, private databaseService: DatabaseService) {
		console.log('LoreService starting');
		combineLatest(databaseService.actors$('TestProject'), this.cursor$).subscribe(([actors, cursor]) => {
			console.log(`Found our document! cursor: ${cursor.unix()}`);
			actors.forEach(actor => {
				for (const node of actor.states.nodes()) {
					console.log(`node: ${node.k.unix}`);
				}
				const enclosure = actor.states.enclosingNodes(new UnixWrapper(cursor.unix())) as Enclosing<
					Node<UnixWrapper, ActorDelta>
				>;
				if (enclosure.first && enclosure.last) {
					console.log(enclosure);
					console.log(
						`cursor.unix(): ${cursor.unix()} enclosure.last.k ${enclosure.last.k.unix} enclosure.first.k: ${
							enclosure.first.k.unix
						}`
					);
					const t = normalize(cursor.unix(), enclosure.last.k.unix, enclosure.first.k.unix, 0, 1);

					const actorObject = engineService.globe.getObjectByName(actor.id);
					let group: Group;
					if (actorObject) {
						group = actorObject.parent as Group;
					} else {
						group = new Group();
						group.add(new Point(actor.id));
						engineService.globe.add(group);
					}

					group.lookAt(enclosure.last.v.position);
					const fromQ = group.quaternion.clone();
					group.lookAt(enclosure.first.v.position);
					const toQ = group.quaternion.clone();

					Quaternion.slerp(fromQ, toQ, group.quaternion, t);

					console.log(`hello t: ${t}`);
				}
			});
		});
	}
}
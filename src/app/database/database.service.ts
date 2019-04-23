import { TextureDelta } from './../model/texture-delta.class';
import { Tree } from '@alexaegis/avl';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import * as idb from 'pouchdb-adapter-idb';
import RxDB, { RxDatabase, RxDocument } from 'rxdb';
import { BehaviorSubject, combineLatest, from, Observable, Subject, zip, of } from 'rxjs';
import { filter, map, mergeMap, shareReplay, switchMap, take, tap, share, delayWhen } from 'rxjs/operators';

import { ActorDelta } from '../model/actor-delta.class';
import { loreSchema, Lore } from '../model/lore.class';
import { UnixWrapper } from '../model/unix-wrapper.class';
import { Actor } from './../model/actor.class';
import { Database, DatabaseCollections, LoreCollection, LoreCollectionMethods, LoreDocumentMethods } from './database';
import { Planet } from '../model/planet.class';

@Injectable({
	providedIn: 'root'
})
export class DatabaseService {
	constructor() {
		RxDB.plugin(idb);
		this.currentDocument$ = new BehaviorSubject<string>('TestProject');

		this.connection$ = from(
			RxDB.create<DatabaseCollections>({
				name: 'loredb',
				adapter: 'idb'
			})
		).pipe(
			delayWhen(db =>
				from(
					db.collection<LoreCollection>({
						name: 'lore',
						schema: loreSchema,
						statics: this.loreCollectionMethods,
						methods: this.loreDocumentMethods
					})
				)
			),
			map(db => {
				db.lore.postInsert(async function postCreateHook(this: LoreCollection, lore) {
					// console.log(`Post Insert ${lore.name}`);
				}, true);
				db.lore.postCreate(async function postCreateHook(this: LoreCollection, lore) {
					// console.log(`Post Create ${lore.name}`);
				});
				db.lore.preSave(async function preSaveHook(this: LoreCollection, lore) {
					if (lore !== undefined && lore !== null) {
						/*
							if (lore.textureTree) {
								lore.textureTreeString = lore.textureTree.stringify();
								lore.textureTree = undefined;
								// delete lore.textureTree;
							}
							*/
						for (const actor of lore.actors) {
							if (actor.states) {
								actor.statesString = actor.states.stringify();
								actor.states = undefined;
								// delete actor.states;
							}
						}
					}
				}, true);
				db.lore.preInsert(async function preInsertHook(this: LoreCollection, lore) {
					console.log(`Before inserting ${lore.name}`);
				}, true);
				db.lore.postInsert(
					function myPostInsertHook(
						this: LoreCollection,
						lore,
						document // RxDocument
					) {
						// console.log('insert to ' + this.name + '-collection: ' + document.name);
					},
					false // not async
				);
				return db;
			}),
			delayWhen(db => this.initData(db, this.currentDocument$.value)), // TODO Check delayWhen alternative
			share()
		);

		this.currentLore$ = combineLatest(this.currentDocument$, this.connection$).pipe(
			switchMap(([name, conn]) => conn.lore.findOne({ name: name }).$),
			filter(res => res !== undefined && res !== null),
			tap(lore => lore.actors.map(this.actorStateMapper)),
			shareReplay(1)
		);

		this.actorCount$ = this.currentLore$.pipe(map(res => res.actors.length));
		this.loreCount$ = this.connection$.pipe(
			switchMap(conn => conn.lore.find().$),
			filter(res => res !== undefined && res !== null),
			map(next => next.length)
		);

		this.actors$ = this.currentLore$.pipe(map(lore => lore.actors.map(this.actorStateMapper)));
	}

	public connection$: Observable<Database>;
	public currentDocument$: BehaviorSubject<string>;
	public currentLore$: Observable<RxDocument<Lore, LoreDocumentMethods>>;
	public actors$: Observable<Array<Actor>>;

	private loreDocumentMethods: LoreDocumentMethods = {
		actorCount: function() {
			// console.log(`actors length: ${this.actors}`);
			return this.actors === undefined || this.actors === null ? 0 : this.actors.length;
		},
		nextId: function(): string {
			return `${this.actors.map(actor => Number(actor.id)).reduce((acc, next) => (acc < next ? next : acc)) + 1}`;
		}
	};

	private loreCollectionMethods: LoreCollectionMethods = {
		countAllDocuments: async function() {
			return (await this.find().exec()).length;
		}
	};

	public actorCount$: Observable<number>;

	public loreCount$: Observable<number>;

	private initData(
		conn: RxDatabase<DatabaseCollections>,
		withName: string
	): Observable<RxDocument<Lore, LoreDocumentMethods>> {
		const testActor1 = new Actor('1');
		testActor1.states.set(
			new UnixWrapper(moment('2019-01-02').unix()),
			new ActorDelta('a', { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 }, 'know1')
		);
		testActor1.states.set(
			new UnixWrapper(moment('2019-01-03').unix()),
			new ActorDelta(undefined, { x: 0.09669254683261017, y: -0.497612862967823, z: 0.8617354361375862 })
		);
		testActor1.states.set(
			new UnixWrapper(moment('2019-01-04').unix()),
			new ActorDelta(undefined, { x: 0.39117893980613805, y: 0.386437376899397, z: 0.8346608718892985 })
		);
		testActor1.states.set(
			new UnixWrapper(moment('2019-01-05').unix()),
			new ActorDelta(undefined, { x: -0.605726277152065, y: 0.5558722625716483, z: 0.5690292996108239 }, 'know2')
		);

		const testActor2 = new Actor('2');
		testActor2.states.set(
			new UnixWrapper(moment('2019-01-03').unix()),
			new ActorDelta(undefined, { x: 0.09669254683261017, y: -0.497612862967823, z: 0.8617354361375862 })
		);

		const testActor3 = new Actor('3');
		testActor3.states.set(
			new UnixWrapper(moment('2019-01-07').unix()),
			new ActorDelta('a', { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 }, 'know1')
		);
		testActor3.states.set(
			new UnixWrapper(moment('2019-01-08').unix()),
			new ActorDelta(undefined, { x: 0.09669254683261017, y: -0.497612862967823, z: 0.8617354361375862 })
		);

		const testActor4 = new Actor('4');
		testActor4.states.set(
			new UnixWrapper(moment('2019-01-07').unix()),
			new ActorDelta('a', { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 }, 'know1')
		);
		testActor4.states.set(
			new UnixWrapper(moment('2019-01-08').unix()),
			new ActorDelta(undefined, { x: 0.09669254683261017, y: -0.497612862967823, z: 0.8617354361375862 })
		);
		testActor4.states.set(
			new UnixWrapper(moment('2019-01-10').unix()),
			new ActorDelta(undefined, { x: -0.605726277152065, y: 0.5558722625716483, z: 0.5690292996108239 }, 'know2')
		);
		const testActor5 = new Actor('5');
		testActor5.states.set(
			new UnixWrapper(moment('2019-01-07').unix()),
			new ActorDelta('a', { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 }, 'know1')
		);
		testActor5.states.set(
			new UnixWrapper(moment('2019-01-10').unix()),
			new ActorDelta(undefined, { x: -0.605726277152065, y: 0.5558722625716483, z: 0.5690292996108239 }, 'know2')
		);

		return from(
			new Promise<string>((res, rej) => {
				const image = new Image();
				// image.src = `assets/world-invert.png`;
				image.src = `assets/elev_bump_8k.jpg`;

				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');

				canvas.width = 4096;
				canvas.height = 4096;
				image.onload = () => {
					ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // TODO scale it
					res(canvas.toDataURL());
				};
				image.onerror = rej;
			})
		).pipe(
			switchMap(img =>
				conn.lore.upsert({
					name: withName,
					actors: [testActor1, testActor2, testActor3, testActor4, testActor5],
					locations: ['City17', 'City14'],
					planet: new Planet(1, img)
				})
			),
			tap(next => console.log(`Initial project document upserted!`))
		);
	}

	public actorStateMapper(actor: Actor) {
		if (actor.statesString) {
			actor.states = Tree.parse<UnixWrapper, ActorDelta>(actor.statesString, UnixWrapper, ActorDelta);
			actor.statesString = undefined;
		} else if (!actor.states) {
			actor.states = new Tree<UnixWrapper, ActorDelta>();
		}
		return actor;
	}
}

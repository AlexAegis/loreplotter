import { TextureDelta } from './../model/texture-delta.class';
import { Tree } from '@alexaegis/avl';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import * as idb from 'pouchdb-adapter-idb';
import RxDB from 'rxdb';
import { BehaviorSubject, combineLatest, from, Observable, Subject, zip } from 'rxjs';
import { filter, map, mergeMap, shareReplay, switchMap, take } from 'rxjs/operators';

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
		from(
			RxDB.create<DatabaseCollections>({
				name: 'loredb',
				adapter: 'idb'
			})
		)
			.pipe(
				mergeMap(db =>
					from(
						db.collection<LoreCollection>({
							name: 'lore',
							schema: loreSchema,
							statics: this.loreCollectionMethods,
							methods: this.loreDocumentMethods
						})
					).pipe(map(coll => db))
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
				})
			)
			.subscribe(db => {
				console.log('Database initialized!');
				this.db.next(db);
				this.initData();
			});
	}

	public get connection() {
		return this.db.pipe(filter(next => next !== undefined));
	}
	public currentDocument = new BehaviorSubject<string>('TestProject');

	private db: BehaviorSubject<Database> = new BehaviorSubject(undefined);

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

	public currentLore = combineLatest(this.currentDocument, this.connection).pipe(
		switchMap(([name, conn]) => conn.lore.findOne({ name: name }).$),
		filter(res => res !== undefined && res !== null),
		/*map(lore => {
			if (lore.textureTreeString) {
				lore.textureTree = Tree.parse<UnixWrapper, TextureDelta>(
					lore.textureTreeString,
					UnixWrapper,
					TextureDelta
				);
				lore.textureTreeString = undefined;
			} else if (!lore.textureTree) {
				lore.textureTree = new Tree<UnixWrapper, TextureDelta>();
			}
			return lore;
		}),*/
		shareReplay(1)
	);

	private initData() {
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

		const imageURLSubject = new Subject<string>();

		const image = new Image();
		// image.src = `assets/world-invert.png`;
		image.src = `assets/elev_bump_8k.jpg`;

		const canvas = document.createElement('canvas');
		const ctx = canvas.getContext('2d');

		canvas.width = 4096;
		canvas.height = 4096;
		image.onload = () => {
			ctx.drawImage(image, 0, 0, canvas.width, canvas.height); // TODO scale it
			imageURLSubject.next(canvas.toDataURL());
		};

		// imageURLSubject.next(undefined);
		zip(this.connection, imageURLSubject.pipe(take(1)))
			.pipe(
				switchMap(([conn, img]) =>
					conn.lore.upsert({
						name: this.currentDocument.value,
						actors: [testActor1, testActor2, testActor3, testActor4, testActor5],
						locations: ['City17', 'City14'],
						planet: new Planet(1, img)
					})
				)
			)
			.subscribe(next => console.log(`Initial project document upserted!`));
	}

	public loreCount$(): Observable<number> {
		return this.connection.pipe(
			switchMap(conn => conn.lore.find().$),
			filter(res => res !== undefined && res !== null),
			map(next => next.length)
		);
	}

	public get actorCount$(): Observable<number> {
		return this.currentLore.pipe(map(res => res.actors.length));
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

	public get actors$(): Observable<Array<Actor>> {
		return this.currentLore.pipe(
			map(lore => {
				return lore.actors.map(this.actorStateMapper);
			})
		);
	}
}

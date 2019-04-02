import { Vector3Serializable } from './../model/vector3-serializable.class';
import { Actor } from './../model/actor.class';
import { Injectable } from '@angular/core';

import RxDB, { RxDatabase, RxCollection, RxJsonSchema, RxDocument } from 'rxdb';
import { Observable, from, BehaviorSubject, merge, zip, of, combineLatest } from 'rxjs';
import { map, tap, mergeMap, switchMap, filter } from 'rxjs/operators';
import * as idb from 'pouchdb-adapter-idb';
import { Database, LoreCollectionMethods, LoreDocumentMethods, LoreCollection, DatabaseCollections } from './database';
import { Lore, loreSchema } from '../model/lore.class';
import { ActorDelta } from '../model/actor-delta.class';
import * as moment from 'moment';
import { Vector3 } from 'three';
import { TypedJSON } from 'typedjson';
import { Tree } from '@alexaegis/avl';
import { UnixWrapper } from '../model/unix-wrapper.class';

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
						console.log(`Pre Save ${lore.name}`);
						if (lore !== undefined && lore !== null) {
							for (const actor of lore.actors) {
								if (actor.states) {
									actor.statesString = actor.states.stringify();
									actor.states = undefined;
								}
								console.log(`Pre Save actors ${actor.id} sst: ${actor.statesString}`);
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
		filter(res => res !== undefined && res !== null)
	);

	private initData() {
		const testActor1 = new Actor('1');
		testActor1.states.set(
			new UnixWrapper(moment('2019-01-02').unix()),
			new ActorDelta(
				'a',
				new Vector3Serializable(-0.3757916966063185, -0.281843772454739, 0.8827749608149299),
				'know1'
			)
		);
		console.log(`size of his: ${testActor1.states.length}`);
		testActor1.states.set(
			new UnixWrapper(moment('2019-01-03').unix()),
			new ActorDelta(
				undefined,
				new Vector3Serializable(0.09669254683261017, -0.497612862967823, 0.8617354361375862)
			)
		);
		console.log(`size of his: ${testActor1.states.length}`);
		testActor1.states.set(
			new UnixWrapper(moment('2019-01-04').unix()),
			new ActorDelta(
				undefined,
				new Vector3Serializable(0.39117893980613805, 0.386437376899397, 0.8346608718892985)
			)
		);
		console.log(`size of his: ${testActor1.states.length}`);
		testActor1.states.set(
			new UnixWrapper(moment('2019-01-05').unix()),
			new ActorDelta(
				undefined,
				new Vector3Serializable(-0.605726277152065, 0.5558722625716483, 0.5690292996108239),
				'know2'
			)
		);
		console.log(`size of his: ${testActor1.states.length}`);
		this.connection
			.pipe(
				switchMap(conn =>
					conn.lore.upsert({
						name: this.currentDocument.value,
						actors: [testActor1],
						locations: ['City17', 'City14']
					})
				)
			)
			.subscribe(next => console.log(`Initial project document upserted! ${JSON.stringify(next)}`));
	}

	public loreCount$(): Observable<number> {
		return this.connection.pipe(
			switchMap(conn => conn.lore.find().$),
			filter(res => res !== undefined && res !== null),
			map(next => next.length)
		);
	}

	public actorCount$(): Observable<number> {
		return this.currentLore.pipe(map(res => res.actors.length));
	}

	public actors$(): Observable<Array<Actor>> {
		return this.currentLore.pipe(
			map(lore => {
				console.log('shite');
				return lore.actors.map(actor => {
					if (actor.statesString) {
						actor.states = Tree.parse<UnixWrapper, ActorDelta>(actor.statesString, UnixWrapper, ActorDelta);
						actor.statesString = undefined;
					}
					return actor;
				});
			})
		);
	}
}

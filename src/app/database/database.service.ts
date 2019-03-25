import { Actor } from './../model/actor.class';
import { Injectable } from '@angular/core';

import RxDB, { RxDatabase, RxCollection, RxJsonSchema, RxDocument } from 'rxdb';
import { Observable, from, BehaviorSubject, merge, zip, of } from 'rxjs';
import { map, tap, mergeMap, switchMap, filter, flatMap, delayWhen, bufferWhen, concatMap } from 'rxjs/operators';
import * as idb from 'pouchdb-adapter-idb';
import { NonNullAssert } from '@angular/compiler';
import { mapInWorker } from '@datorama/akita';
import { delay } from 'q';
import { Database, LoreCollectionMethods, LoreDocumentMethods, LoreCollection, DatabaseCollections } from './database';
import { Lore, loreSchema } from '../model/lore.class';
import { initDomAdapter } from '@angular/platform-browser/src/browser';
import { ActorDelta } from '../model/actor-delta.class';
import * as moment from 'moment';

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
							methods: this.loreCollectionMethods,
							statics: this.loreDocumentMethods
						})
					).pipe(map(coll => db))
				),
				map(db => {
					db.lore.postInsert(async function postCreateHook(this: LoreCollection, lore) {
						console.log(`Post Insert ${lore.name}`);
					}, true);
					db.lore.postCreate(async function postCreateHook(this: LoreCollection, lore) {
						console.log(`Post Create ${lore.name}`);
					});
					db.lore.preSave(async function preSaveHook(this: LoreCollection, lore) {
						console.log(`Pre Save ${lore.name}`);
						if (lore !== undefined && lore !== null) {
							for (const actor of lore.actors) {
								console.log(`Pre Save actors ${actor.id}`);
								actor.statesString = actor.states.stringify();
								actor.states = undefined;
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
							console.log('insert to ' + this.name + '-collection: ' + document.name);
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

	private db: BehaviorSubject<Database> = new BehaviorSubject(undefined);

	private loreDocumentMethods: LoreDocumentMethods = {
		actorCount: function(what: string) {
			console.log(`actors length: ${this.actors}`);
			return this.actors === undefined || this.actors === null ? 0 : this.actors.length;
		}
	};

	private loreCollectionMethods: LoreCollectionMethods = {
		countAllDocuments: async function() {
			return (await this.find().exec()).length;
		}
	};

	private initData() {
		this.connection
			.pipe(
				switchMap(conn =>
					conn.lore.upsert({
						name: 'TestProject2',
						actors: [new Actor(2).setState(moment('2019-01-02').unix(), new ActorDelta()), new Actor(1)],
						locations: ['City17', 'City14']
					})
				)
			)
			.subscribe(next => console.log(`Initial project document upserted! ${JSON.stringify(next)}`));
	}

	public loreCount$(): Observable<number> {
		return this.connection.pipe(
			switchMap(conn => conn.lore.find().exec()),
			filter(res => res !== undefined && res !== null),
			map(next => next.length)
		);
	}

	public actorCount$(name: string): Observable<number> {
		return this.connection.pipe(
			switchMap(conn => conn.lore.findOne({ name: name }).exec()),
			filter(res => res !== undefined && res !== null),
			map(res => res.actors.length)
		);
	}
}

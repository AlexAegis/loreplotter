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
			return this.actors.length;
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
						actors: [new Actor(0), new Actor(1)],
						locations: ['City17', 'City14']
					})
				)
			)
			.subscribe(next => console.log(`Initial project document upserted! ${JSON.stringify(next)}`));
	}

	public loreCount$(): Observable<number> {
		return this.connection.pipe(
			switchMap(conn => conn.lore.find().exec()),
			map(next => next.length)
		);
	}

	public actorCount$(name: string): Observable<number> {
		return this.connection.pipe(
			switchMap(conn => conn.lore.findOne({ name: name }).exec()),
			map(res => res.actors.length)
		);
	}
}

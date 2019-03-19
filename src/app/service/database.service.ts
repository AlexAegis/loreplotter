import { Injectable } from '@angular/core';

import RxDB, { RxDatabase, RxCollection, RxJsonSchema, RxDocument } from 'rxdb';
import { Observable, from, BehaviorSubject, merge, zip, of } from 'rxjs';
import { map, tap, mergeMap, switchMap, filter, flatMap, delayWhen, bufferWhen, concatMap } from 'rxjs/operators';
import * as idb from 'pouchdb-adapter-idb';
import { NonNullAssert } from '@angular/compiler';
import { mapInWorker } from '@datorama/akita';
import { delay } from 'q';
interface HeroDocType {
	passportId: string;
	firstName: string;
	lastName: string;
	age?: number; // optional
}

interface HeroDocMethods {
	scream: (v: string) => string;
}

type HeroDocument = RxDocument<HeroDocType, HeroDocMethods>;

interface HeroCollectionMethods {
	countAllDocuments: () => Promise<number>;
}

// and then merge all our types
type HeroCollection = RxCollection<HeroDocType, HeroDocMethods, HeroCollectionMethods>;

interface MyDatabaseCollections {
	heroes: HeroCollection;
}

type MyDatabase = RxDatabase<MyDatabaseCollections>;

@Injectable({
	providedIn: 'root'
})
export class DatabaseService {
	private db: BehaviorSubject<MyDatabase> = new BehaviorSubject(undefined);

	get connection() {
		return this.db.pipe(filter(next => next !== undefined));
	}

	heroSchema: RxJsonSchema = {
		title: 'human schema',
		description: 'describes a human being',
		version: 0,
		keyCompression: true,
		type: 'object',
		properties: {
			passportId: {
				type: 'string',
				primary: true
			},
			firstName: {
				type: 'string'
			},
			lastName: {
				type: 'string'
			},
			age: {
				type: 'integer'
			}
		},
		required: ['firstName', 'lastName']
	};

	heroDocMethods: HeroDocMethods = {
		scream: function(this: HeroDocument, what: string) {
			return this.firstName + ' screams: ' + what.toUpperCase();
		}
	};

	heroCollectionMethods: HeroCollectionMethods = {
		countAllDocuments: async function(this: HeroCollection) {
			const allDocs = await this.find().exec();
			return allDocs.length;
		}
	};

	constructor() {
		RxDB.plugin(idb);
		from(
			RxDB.create<MyDatabaseCollections>({
				name: 'loredb',
				adapter: 'idb'
			})
		)
			.pipe(
				mergeMap(next =>
					from(
						next.collection<HeroCollection>({
							name: 'heroes',
							schema: this.heroSchema,
							methods: { ...this.heroDocMethods },
							statics: { ...this.heroCollectionMethods }
						})
					).pipe(map(coll => next))
				),
				map(next => {
					next.heroes.postInsert(
						function myPostInsertHook(
							this: HeroCollection, // own collection is bound to the scope
							docData, // documents data
							doc // RxDocument
						) {
							console.log('insert to ' + this.name + '-collection: ' + doc.firstName);
						},
						false // not async
					);
					return next;
				})
			)
			.subscribe(db => {
				console.log('Database initialized!');
				this.db.next(db);
			});
	}

	public get docCount$(): Observable<number> {
		return this.connection.pipe(
			switchMap(conn => conn.heroes.find().exec()),
			map(next => next.length)
		);
	}
}

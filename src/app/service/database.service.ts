import { Tree } from '@alexaegis/avl';
import { Injectable } from '@angular/core';

import { Actor, ActorDelta, Lore, Planet, UnixWrapper } from '@app/model/data';
import { actorSchema, loreSchema } from '@app/model/schema';
import { StoreFacade } from '@lore/store/store-facade.service';
import moment from 'moment';

import * as idb from 'pouchdb-adapter-idb';
import RxDB, { RxCollection, RxDatabase, RxDocument } from 'rxdb';
import { combineLatest, forkJoin, from, Observable, zip } from 'rxjs';
import { delayWhen, filter, map, mergeMap, shareReplay, switchMap, tap } from 'rxjs/operators';
import { LoreCollectionMethods, LoreDocumentMethods, RxCollections } from './database';

@Injectable()
export class DatabaseService {
	public database$ = from(
		RxDB.create<RxCollections>({
			name: 'lore',
			adapter: 'idb'
		})
	).pipe(
		delayWhen(db =>
			zip(
				db.collection<RxCollection<Lore, LoreDocumentMethods, LoreCollectionMethods>>({
					name: 'lore',
					schema: loreSchema,
					statics: this.loreCollectionMethods,
					methods: this.loreDocumentMethods as any
				}),
				db.collection<RxCollection<Actor, LoreDocumentMethods, LoreCollectionMethods>>({
					name: 'actor',
					schema: actorSchema
				})
			)
		),
		tap(db => {
			db.actor.preSave(async function preSaveHook(this: RxCollection<Actor>, actor) {
				// console.log('PreSave Actor!' + actor.id);
				if (actor !== undefined && actor !== null) {
					if (actor._states) {
						actor.states = actor._states.stringify();
						delete actor._states;
					}
					delete actor._userdata;
				}
			}, true);
			db.actor.preInsert(async function preInsertHook(this: RxCollection<Actor>, actor) {
				// console.log('preInsert Actor!' + actor.id);
				if (actor !== undefined && actor !== null) {
					if (actor._states) {
						actor.states = actor._states.stringify();
						delete actor._states;
					}
					delete actor._userdata;
				}
			}, true);

			db.actor.preCreate(async function preCreateHook(this: RxCollection<Actor>, actor) {
				// console.log('preCreate Actor!' + actor.id);
				if (actor !== undefined && actor !== null) {
					if (actor.states) {
						actor.statesString = actor.states.stringify();
						delete actor.states;
					}
					delete actor._userdata;
				}
			}, true);
		}),
		delayWhen(db => this.initData(db)), // TODO This should read, but set the currentLore's value
		shareReplay(1)
	);

	public currentLore$ = combineLatest([this.storeFacade.selectedLore$, this.database$]).pipe(
		switchMap(([selected, conn]) => conn.lore.findOne({ id: selected.id }).$),
		filter(lore => !!lore),
		shareReplay(1)
	);

	public lores$ = this.database$.pipe(
		switchMap(conn => conn.lore.find().$),
		shareReplay(1)
	);

	public allActors$ = this.database$.pipe(
		switchMap(conn => conn.actor.find().$),
		shareReplay(1)
	);

	public nextActorId$ = this.allActors$.pipe(
		map(actors => `${actors.map(actor => Number(actor.id)).reduce((acc, next) => (acc < next ? next : acc)) + 1}`)
	);

	public nextLoreId$ = this.lores$.pipe(
		map(lores => `${lores.map(lore => Number(lore.id)).reduce((acc, next) => (acc < next ? next : acc)) + 1}`)
	);

	public currentLoreActors$ = combineLatest([this.currentLore$, this.allActors$]).pipe(
		map(([lore, actors]) => actors.filter(actor => actor.loreId === lore.id)),
		map(actors => actors.map(DatabaseService.actorStateMapper) as Array<RxDocument<Actor>>),
		shareReplay(1)
	);

	public actorCount$ = this.currentLoreActors$.pipe(
		map(actors => actors.length),
		shareReplay(1)
	);

	public constructor(private storeFacade: StoreFacade) {}

	private loreDocumentMethods: LoreDocumentMethods = {
		collectActors: function(
			stateMapper: (actor: RxDocument<Actor, {}>) => RxDocument<Actor, {}>
		): Observable<RxDocument<Actor>[]> {
			return this.collection.database.actor
				.find({ lore: this.name })
				.$.pipe(map(actors => actors.map(stateMapper)));
		}
	};

	private loreCollectionMethods: LoreCollectionMethods = {
		countAllDocuments: async function() {
			return (await this.find().exec()).length;
		}
	};

	public static actorStateMapper(actor: RxDocument<Actor> | Actor): RxDocument<Actor> | Actor {
		if (actor.states) {
			actor._states = Tree.parse<UnixWrapper, ActorDelta>(actor.states, UnixWrapper, ActorDelta);
			delete actor.states; // Making it undefined triggers an RxError that the set of a field can't be setted
		} else if (!actor._states) {
			actor._states = new Tree<UnixWrapper, ActorDelta>();
		}
		return actor;
	}

	private initData(conn: RxDatabase<RxCollections>): Observable<any> {
		const testKMA = new Map();
		testKMA.set('Favourite color', 'blue');
		testKMA.set('Has a cat', 'yes');
		const testKMB = new Map();
		testKMB.set('Favourite color', 'red');
		const testActor1 = new Actor('1');
		testActor1._states.set(
			new UnixWrapper(moment('2019-05-02').unix()),
			new ActorDelta('a', { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 }, testKMA, 6)
		);
		testActor1._states.set(
			new UnixWrapper(moment('2019-05-03').unix()),
			new ActorDelta(undefined, {
				x: 0.09669254683261017,
				y: -0.497612862967823,
				z: 0.8617354361375862
			})
		);
		testActor1._states.set(
			new UnixWrapper(moment('2019-05-04').unix()),
			new ActorDelta(undefined, {
				x: 0.39117893980613805,
				y: 0.386437376899397,
				z: 0.8346608718892985
			})
		);
		testActor1._states.set(
			new UnixWrapper(moment('2019-05-05').unix()),
			new ActorDelta(undefined, { x: -0.605726277152065, y: 0.5558722625716483, z: 0.5690292996108239 }, testKMB)
		);

		const testActor2 = new Actor('2');
		testActor2._states.set(
			new UnixWrapper(moment('2019-05-03').unix()),
			new ActorDelta(undefined, {
				x: 0.09669254683261017,
				y: -0.497612862967823,
				z: 0.8617354361375862
			})
		);

		const testActor3 = new Actor('3');
		testActor3._states.set(
			new UnixWrapper(moment('2019-05-07').unix()),
			new ActorDelta('a', { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 })
		);
		testActor3._states.set(
			new UnixWrapper(moment('2019-05-08').unix()),
			new ActorDelta(undefined, {
				x: 0.09669254683261017,
				y: -0.497612862967823,
				z: 0.8617354361375862
			})
		);

		const testActor4 = new Actor('4');
		testActor4._states.set(
			new UnixWrapper(moment('2019-05-07').unix()),
			new ActorDelta('a', { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 })
		);
		testActor4._states.set(
			new UnixWrapper(moment('2019-05-08').unix()),
			new ActorDelta(undefined, {
				x: 0.09669254683261017,
				y: -0.497612862967823,
				z: 0.8617354361375862
			})
		);
		testActor4._states.set(
			new UnixWrapper(moment('2019-05-10').unix()),
			new ActorDelta(undefined, {
				x: -0.605726277152065,
				y: 0.5558722625716483,
				z: 0.5690292996108239
			})
		);
		const testActor5 = new Actor('5');
		testActor5._states.set(
			new UnixWrapper(moment('2019-05-07').unix()),
			new ActorDelta('a', { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 })
		);
		testActor5._states.set(
			new UnixWrapper(moment('2019-05-10').unix()),
			new ActorDelta(undefined, {
				x: -0.605726277152065,
				y: 0.5558722625716483,
				z: 0.5690292996108239
			})
		);

		const loreId = '0';
		const loreName = 'Example';
		return zip(
			conn.lore.upsert({
				id: loreId,
				name: loreName,
				locations: ['City17', 'City14'],
				planet: new Planet(Planet.DEFAULT_NAME, Planet.DEFAULT_RADIUS)
			}),
			from(fetch(`assets/elev_bump_8k.jpg`)).pipe(switchMap(p => p.blob()))
		).pipe(
			delayWhen(() =>
				forkJoin(
					[testActor1, testActor2, testActor3, testActor4, testActor5].map(
						actor => (actor.loreId = loreId) && conn.actor.upsert(actor)
					)
				)
			),
			mergeMap(([lore, image]) =>
				from(
					lore.putAttachment({
						id: 'texture', // string, name of the attachment like 'cat.jpg'
						data: image, // (string|Blob|Buffer) data of the attachment
						type: 'image/jpeg' // (string) type of the attachment-data like 'image/jpeg'
					})
				).pipe(map(() => lore))
			)
		);
	}
}

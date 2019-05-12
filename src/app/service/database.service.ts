import { Tree } from '@alexaegis/avl';
import { Injectable } from '@angular/core';

import {
	Actor,
	ActorDelta,
	actorDeltaSchema,
	actorSchema,
	Lore,
	loreSchema,
	Planet,
	PLANET_DEFAULT_NAME,
	PLANET_DEFAULT_RADIUS
} from '@app/model/data';
import { StoreFacade } from '@lore/store/store-facade.service';
import moment from 'moment';

import * as idb from 'pouchdb-adapter-idb';
import RxDB, { RxCollection, RxDatabase, RxDocument } from 'rxdb';
import { combineLatest, concat, EMPTY, forkJoin, from, Observable, of, zip } from 'rxjs';
import { delayWhen, filter, map, mergeMap, shareReplay, switchMap, tap } from 'rxjs/operators';
import { LoreCollectionMethods, LoreDocumentMethods, RxCollections } from './database';

@Injectable()
export class DatabaseService {
	public database$ = from(
		RxDB.create<RxCollections>({
			name: 'loreplotter',
			adapter: 'idb'
		})
	).pipe(
		tap(a => console.log('CREEAT DB')),
		delayWhen(db =>
			zip(
				db.lore ? of(true): db.collection<RxCollection<Lore, LoreDocumentMethods, LoreCollectionMethods>>({
					name: 'lore',
					schema: loreSchema,
					statics: this.loreCollectionMethods,
					methods: this.loreDocumentMethods as any
				}),
				db.actor ? of(true):  db.collection<RxCollection<Actor>>({
					name: 'actor',
					schema: actorSchema
				}),
				db.delta ? of(true) : db.collection<RxCollection<ActorDelta>>({
					name: 'delta',
					schema: actorDeltaSchema
				})
			)
		),
		tap(db => { // TODO: Delete these hooks
			db.actor.preSave(async function preSaveHook(this: RxCollection<Actor>, actor) {
				console.log(`${this.name} pre-save`);
				console.log(actor);
			}, true);
			db.actor.preInsert(async function preInsertHook(this: RxCollection<Actor>, actor) {
				console.log(`${this.name} pre-insert`);
				console.log(actor);
			}, true);
			db.actor.preCreate(async function preCreateHook(this: RxCollection<Actor>, actor) {
				console.log(`${this.name} pre-create`);
				console.log(actor);
			}, true);

			db.delta.preSave(async function preSaveHook(this: RxCollection<ActorDelta>, actorDelta) {
				console.log(`${this.name} pre-save`);
				console.log(actorDelta);
			}, true);
			db.delta.preInsert(async function preInsertHook(this: RxCollection<ActorDelta>, actorDelta) {
				console.log(`${this.name} pre-insert`);
				console.log(actorDelta);
			}, true);
			db.delta.preCreate(async function preCreateHook(this: RxCollection<ActorDelta>, actorDelta) {
				console.log(`${this.name} pre-create`);
				console.log(actorDelta);
			}, true);
		}),
		delayWhen(db => this.initData(db)),
		shareReplay(1)
	);

	public currentLore$ = combineLatest([this.storeFacade.selectedLore$.pipe(filter(selected => selected !== undefined)), this.database$]).pipe(
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

	public allDeltas$ = this.database$.pipe(
		switchMap(conn => conn.delta.find().$),
		shareReplay(1)
	);

	public nextActorId$ = this.allActors$.pipe(
		map(
			actors => `${actors.map(actor => Number(actor.id)).reduce((acc, next) => (acc < next ? next : acc), 0) + 1}`
		)
	);

	public nextLoreId$ = this.lores$.pipe(
		map(lores => `${lores.map(lore => Number(lore.id)).reduce((acc, next) => (acc < next ? next : acc), 0) + 1}`),

		shareReplay(1)
	);

	public currentLoreActors$ = combineLatest([this.currentLore$, this.allActors$]).pipe(
		map(([lore, actors]) => actors.filter(actor => actor.loreId === lore.id)),
		shareReplay(1),
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

	public initData(conn: RxDatabase<RxCollections>): Observable<RxDocument<Lore>> {

		const loreId = '0';
		const loreName = 'Example';

		const exampleLore = {
			id: loreId,
			name: loreName,
			planet: { name: PLANET_DEFAULT_NAME, radius: PLANET_DEFAULT_RADIUS }
		};

		const actor1Id = '0';
		const testActor1: Actor = { id: actor1Id, loreId };

		const testActor1Deltas: Array<ActorDelta> = [
			{
				id: '0',
				actorId: actor1Id,
				unix: moment('2019-05-12').unix(),
				maxSpeed: 40,
				position: { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 } ,
				properties: [ {key: 'Favourite color', value: 'Blue'}, {key: 'Mood', value: 'Angry'}]
			},
			{
				id: '1',
				actorId: actor1Id,
				unix: moment('2019-05-13').unix(),
				position: {
					x: 0.09669254683261017,
					y: -0.497612862967823,
					z: 0.8617354361375862
				}
			},
			{
				id: '2',
				actorId: actor1Id,
				unix: moment('2019-05-14').unix(),
				position: {
					x: 0.09669254683261017,
					y: -0.497612862967823,
					z: 0.8617354361375862
				}
			}
		];


		const actor2Id = '1';
		const testActor2: Actor = { id: actor2Id, loreId };

		const testActor2Deltas: Array<ActorDelta> = [
			{
				id: '3',
				actorId: actor2Id,
				unix: moment('2019-05-11').unix(),
				maxSpeed: 40,
				position: { x: -0.3757916966063185, y: -0.281843772454739, z: 0.8827749608149299 } ,
				properties: [ {key: 'Favourite color', value: 'Red'}, {key: 'Mood', value: 'Happy'}]
			},
			{
				id: '4',
				actorId: actor2Id,
				unix: moment('2019-05-13').unix(),
				position:{
					x: 0.09669254683261017,
					y: -0.497612862967823,
					z: 0.8617354361375862
				}
			},
			{
				id: '5',
				actorId: actor2Id,
				unix: moment('2019-05-18').unix(),
				position: {
					x: 0.09669254683261017,
					y: -0.497612862967823,
					z: 0.8617354361375862
				},
				properties: [ {key: 'Favourite color', value: 'Green'}, {key: 'Mood', value: 'Lazy'}]
			}
		];

		return zip(
			conn.lore.atomicUpsert(exampleLore),
			from(fetch(`assets/elev_bump_8k.jpg`)).pipe(switchMap(p => p.blob()))
		).pipe(
			delayWhen(() =>
				forkJoin(
					 ...[testActor1, testActor2].map(
						actor => conn.actor.atomicUpsert(actor)
					)
				)
			),
			delayWhen(() => forkJoin(testActor1Deltas.map(delta => conn.delta.atomicUpsert(delta)))),
			delayWhen(() => forkJoin(testActor2Deltas.map(delta => conn.delta.atomicUpsert(delta)))),
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

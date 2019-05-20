import { Tree } from '@alexaegis/avl';
import { Injectable } from '@angular/core';

import { Actor, ActorDelta, exampleActors, exampleLore, Lore, serializeActor, UnixWrapper } from '@app/model/data';
import { actorSchema, loreSchema } from '@app/model/schema';
import { StoreFacade } from '@lore/store/store-facade.service';

import * as idb from 'pouchdb-adapter-idb';
import RxDB, { RxCollection, RxDatabase, RxDocument } from 'rxdb';
import { combineLatest, from, Observable, zip } from 'rxjs';
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
				serializeActor(actor);
			}, true);
			db.actor.preInsert(async function preInsertHook(this: RxCollection<Actor>, actor) {
				serializeActor(actor);
			}, true);
			db.actor.preCreate(async function preCreateHook(this: RxCollection<Actor>, actor) {
				serializeActor(actor);
			}, true);
		}),
		delayWhen(db => this.initData(db)),
		shareReplay(1)
	);

	public currentLore$ = combineLatest([
		this.storeFacade.selectedLore$.pipe(filter(id => id !== undefined)),
		this.database$
	]).pipe(
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
		map(actors => actors.map(DatabaseService.actorStateMapper) as Array<RxDocument<Actor>>),
		// withTeardown(),
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
			for (const node of actor._states.nodes()) {
				node.key.unix = Math.floor(node.key.unix);
			}
			delete actor.states; // Making it undefined triggers an RxError that the set of a field can't be setted
		} else if (!actor._states) {
			actor._states = new Tree<UnixWrapper, ActorDelta>();
		}
		return actor;
	}

	public initData(conn: RxDatabase<RxCollections>): Observable<RxDocument<Lore>> {
		return zip(
			conn.lore.upsert(exampleLore),
			from(exampleActors).pipe(mergeMap(actor => conn.actor.upsert(actor))),
			from(fetch(`assets/elev_bump_8k.jpg`)).pipe(switchMap(p => p.blob()))
		).pipe(
			mergeMap(([lore, actors, image]) =>
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

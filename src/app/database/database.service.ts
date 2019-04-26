import { TextureDelta } from './../model/texture-delta.class';
import { Tree } from '@alexaegis/avl';
import { Injectable } from '@angular/core';
import * as moment from 'moment';
import * as idb from 'pouchdb-adapter-idb';
import RxDB, { RxDatabase, RxDocument, RxCollection } from 'rxdb';
import { BehaviorSubject, combineLatest, from, Observable, Subject, zip, of, timer, forkJoin } from 'rxjs';
import {
	filter,
	map,
	mergeMap,
	shareReplay,
	switchMap,
	take,
	delay,
	tap,
	share,
	delayWhen,
	flatMap,
	catchError,
	withLatestFrom,
	startWith,
	toArray
} from 'rxjs/operators';

import { ActorDelta } from '../model/actor-delta.class';
import { loreSchema, Lore } from '../model/lore.class';
import { UnixWrapper } from '../model/unix-wrapper.class';
import { Actor, actorSchema } from './../model/actor.class';
import { RxCollections, LoreCollectionMethods, LoreDocumentMethods } from './database';
import { Planet } from '../model/planet.class';
import { error } from 'util';

@Injectable({
	providedIn: 'root'
})
export class DatabaseService {
	constructor() {
		RxDB.plugin(idb);
		this.currentLore = new BehaviorSubject<string>('TestProject');

		this.connection$ = from(
			RxDB.create<RxCollections>({
				name: 'loredb',
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
				db.lore.preSave(async function preSaveHook(this: RxCollection<Lore>, lore) {
					console.log('PreSave Lore!' + lore.name);
				}, true);
				db.actor.preSave(async function preSaveHook(this: RxCollection<Actor>, actor) {
					console.log('PreSave Actor!' + actor.id);
					if (actor !== undefined && actor !== null) {
						if (actor.states) {
							actor.statesString = actor.states.stringify();
							delete actor.states;
						}
					}
				}, true);
				db.actor.preInsert(async function preInsertHook(this: RxCollection<Actor>, actor) {
					console.log('preInsert Actor!' + actor.id);
					if (actor !== undefined && actor !== null) {
						if (actor.states) {
							actor.statesString = actor.states.stringify();
							delete actor.states;
						}
					}
				}, true);

				db.actor.preCreate(async function preCreateHook(this: RxCollection<Actor>, actor) {
					console.log('preCreate Actor!' + actor.id);
					if (actor !== undefined && actor !== null) {
						if (actor.states) {
							actor.statesString = actor.states.stringify();
							delete actor.states;
						}
					}
				}, true);
			}),
			// delayWhen(db => this.initData(db, this.currentLore.value)), // TODO This should read, but set the currentLore's value
			shareReplay(1)
		);

		this.currentLore$ = combineLatest([this.currentLore, this.connection$]).pipe(
			switchMap(([name, conn]) => conn.lore.findOne({ name: name }).$),
			filter(lore => !!lore),
			shareReplay(1)
		);

		this.lores$ = this.connection$.pipe(
			switchMap(conn => conn.lore.find().$),
			shareReplay(1)
		);

		this.loreCount$ = this.lores$.pipe(map(lores => lores.length));

		this.allActors$ = this.connection$.pipe(
			switchMap(conn => conn.actor.find().$),
			shareReplay(1)
		);

		this.nextActorId$ = this.allActors$.pipe(
			map(
				actors =>
					`${actors.map(actor => Number(actor.id)).reduce((acc, next) => (acc < next ? next : acc)) + 1}`
			)
		);

		this.currentLoreActors$ = combineLatest([this.currentLore$, this.allActors$]).pipe(
			map(([lore, actors]) => actors.filter(actor => actor.lore === lore.name)),
			map(actors => actors.map(this.actorStateMapper)),
			shareReplay(1)
		);

		this.actorCount$ = this.currentLoreActors$.pipe(
			map(actors => actors.length),
			shareReplay(1)
		);
	}

	public connection$: Observable<RxDatabase<RxCollections>>;
	public currentLore: BehaviorSubject<string>;
	public currentLore$: Observable<RxDocument<Lore, LoreDocumentMethods>>;
	public allActors$: Observable<Array<RxDocument<Actor>>>;
	public currentLoreActors$: Observable<Array<RxDocument<Actor>>>;
	public nextActorId$: Observable<string>;

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

	public actorCount$: Observable<number>;

	public lores$: Observable<RxDocument<Lore>[]>;
	public loreCount$: Observable<number>;

	private initData(conn: RxDatabase<RxCollections>, withName: string): Observable<any> {
		console.log('assemble initial data');
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

		const upLore = zip(
			conn.lore.upsert({
				name: withName,
				locations: ['City17', 'City14'],
				planet: new Planet('Earth', 1)
			}),
			from(fetch(`assets/elev_bump_8k.jpg`)).pipe(switchMap(p => p.blob()))
		).pipe(
			delayWhen(([lore, image]) =>
				forkJoin(
					[testActor1, testActor2, testActor3, testActor4, testActor5].map(
						actor => (actor.lore = withName) && conn.actor.upsert(actor)
					)
				)
			),
			tap(next => console.log(`Initial project`)),
			mergeMap(([lore, image]) =>
				from(
					lore.putAttachment({
						id: 'texture', // string, name of the attachment like 'cat.jpg'
						data: image, // (string|Blob|Buffer) data of the attachment
						type: 'image/jpeg' // (string) type of the attachment-data like 'image/jpeg'
					})
				).pipe(map(att => lore))
			),
			tap(next => console.log(`Initial project document upserted!`))
		);

		return upLore;
	}

	public actorStateMapper(actor: RxDocument<Actor>): RxDocument<Actor> {
		if (actor.statesString) {
			actor.states = Tree.parse<UnixWrapper, ActorDelta>(actor.statesString, UnixWrapper, ActorDelta);
			delete actor.statesString; // Making it undefined triggers an RxError that the set of a field can't be setted
		} else if (!actor.states) {
			actor.states = new Tree<UnixWrapper, ActorDelta>();
		}
		return actor;
	}
}

import { Node } from '@alexaegis/avl';
import { Injectable } from '@angular/core';
import { refreshBlockOfActor } from '@app/function';
import { enclosingProgress } from '@app/function/enclosing-progress.function';
import { EngineService } from '@app/lore/engine/engine.service';
import { Actor, ActorDelta, UnixWrapper, Vector3Serializable } from '@app/model/data';
import { DatabaseService } from '@app/service/database.service';
import { ActorFormResultData } from '@lore/component';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDocument } from 'rxdb';
import { combineLatest, from, Observable, of, Subject } from 'rxjs';
import { filter, map, mergeMap, mergeScan, pairwise, scan, shareReplay, switchMap, tap, toArray } from 'rxjs/operators';
import { Group, Vector3 } from 'three';

export interface Accumulator {
	cursor: number;
	actor: RxDocument<Actor>;
	accumulator: ActorDeltaAccumulator;
	firstEvent: Node<UnixWrapper, ActorDelta>;
	lastEvent: Node<UnixWrapper, ActorDelta>;
}

export class AccumulatorField<T> {
	appearedIn: Node<UnixWrapper, ActorDelta>;
	value: T;
	nextValue: T;
	nextAppearance: Node<UnixWrapper, ActorDelta>;
}

export class Property<T> {
	key: T;
	value: T;
}

export class ActorDeltaAccumulator {
	id = new AccumulatorField<string>();
	unix = new AccumulatorField<number>();
	name = new AccumulatorField<string>();
	maxSpeed = new AccumulatorField<number>();
	color = new AccumulatorField<string>();
	position = new AccumulatorField<Vector3Serializable>();
	properties: Array<AccumulatorField<Property<String>>> = [];
}

@Injectable()
export class ActorService {
	public actorFormSave = new Subject<ActorFormResultData>();
	// best name ever
	public slerperHelper: Group;
	public latestSlerpsWorldPositionHolder: Vector3;
	public pseudoPoint: Group;
	private _w = new UnixWrapper(0);
	/**
	 * rotates the position t'th way between the enclosure
	 * Returns a new worldPosition at radius 1
	 */
	public lookAtInterpolated = (() => {
		const _result = new Vector3();
		const _norm = new Vector3();
		const _from = new Vector3();
		const _to = new Vector3();
		return (a: Vector3Serializable, b: Vector3Serializable, t: number, target?: Group): Vector3 => {
			_from.copy(a as Vector3);
			_to.copy(b as Vector3);
			if (t === Infinity || isNaN(t)) {
				_result.copy(_from);
			} else if (t === -Infinity) {
				_result.copy(_to);
			} else {
				const ang = _from.angleTo(_to);
				_norm
					.copy(_from)
					.cross(_to)
					.normalize();
				_result.copy(_from).applyAxisAngle(_norm, t * ang);
			}
			if (target) {
				target.lookAt(_result);
			}
			return _result;
		};
	})();
	private _va = new Vector3(); // Helper vector objects

	public constructor(
		private engineService: EngineService,
		private storeFacade: StoreFacade,
		private databaseService: DatabaseService
	) {
		this.slerperHelper = new Group();
		this.pseudoPoint = new Group();
		this.pseudoPoint.position.set(0, 0, 1);
		this.slerperHelper.add(this.pseudoPoint);
		this.latestSlerpsWorldPositionHolder = new Vector3();
	}

	// TODO: This makes a bunch of objects during run
	public actorDeltasAtCursor$: Observable<Array<Accumulator>> = combineLatest([
		this.databaseService.currentLoreActors$,
		this.storeFacade.cursor$
	]).pipe(
		mergeMap(([actors, cursor]) =>
			of(...actors).pipe(
				map(actor => {
					const accumulator = new ActorDeltaAccumulator();
					const propertyMap = new Map<String, AccumulatorField<String>>();
					let firstEvent: Node<UnixWrapper, ActorDelta>;
					let lastEvent: Node<UnixWrapper, ActorDelta>;

					accumulator.color.value = Actor.DEFAULT_COLOR;
					accumulator.maxSpeed.value = Actor.DEFAULT_MAX_SPEED;

					let reached = false;
					for (const node of actor._states.nodes()) {
						if (firstEvent === undefined) {
							firstEvent = node;
						}
						lastEvent = node;

						if (node.key.unix > cursor) {
							reached = true;
						}
						if (!reached) {
							if (node.key.unix !== undefined) {
								accumulator.unix.value = node.key.unix;
								accumulator.unix.appearedIn = node;
							}
							if (node.value.name) {
								accumulator.name.value = node.value.name;
								accumulator.name.appearedIn = node;
							}
							if (node.value.maxSpeed !== undefined) {
								accumulator.maxSpeed.value = node.value.maxSpeed;
								accumulator.maxSpeed.appearedIn = node;
							}
							if (node.value.color) {
								accumulator.color.value = node.value.color;
								accumulator.color.appearedIn = node;
							}
							if (node.value.position !== undefined) {
								accumulator.position.value = node.value.position;
								accumulator.position.appearedIn = node;
							}
							for (const [key, value] of node.value.knowledge.entries()) {
								const prop = propertyMap.get(key);
								if (prop) {
									if (value) {
										prop.value = value;
										prop.appearedIn = node;
									}
								} else {
									const propField = new AccumulatorField<String>();
									propField.value = value;
									propField.appearedIn = node;
									propertyMap.set(key, propField);
								}
							}
						} else {
							if (node.key.unix !== undefined && accumulator.unix.nextAppearance === undefined) {
								accumulator.unix.nextValue = node.key.unix;
								accumulator.unix.nextAppearance = node;
							}
							if (node.value.name && accumulator.name.nextAppearance === undefined) {
								accumulator.name.nextValue = node.value.name;
								accumulator.name.nextAppearance = node;
							}
							if (
								node.value.maxSpeed !== undefined &&
								accumulator.maxSpeed.nextAppearance === undefined
							) {
								accumulator.maxSpeed.nextValue = node.value.maxSpeed;
								accumulator.maxSpeed.nextAppearance = node;
							}
							if (node.value.color && accumulator.color.nextAppearance === undefined) {
								accumulator.color.nextValue = node.value.color;
								accumulator.color.nextAppearance = node;
							}
							if (
								node.value.position !== undefined &&
								accumulator.position.nextAppearance === undefined
							) {
								accumulator.position.nextValue = node.value.position;
								accumulator.position.nextAppearance = node;
							}
							for (const [key, value] of node.value.knowledge.entries()) {
								const prop = propertyMap.get(key);
								if (prop) {
									if (value !== undefined && prop.nextAppearance === undefined) {
										prop.nextValue = value;
										prop.nextAppearance = node;
									}
								} else {
									const propField = new AccumulatorField<String>();
									propField.nextValue = value;
									propField.nextAppearance = node;
									propertyMap.set(key, propField);
								}
							}
						}
					}
					for (const [key, value] of propertyMap.entries()) {
						const accField = new AccumulatorField<Property<String>>();
						accField.nextValue = { key, value: value.nextValue };
						accField.nextAppearance = value.nextAppearance;
						accField.appearedIn = value.appearedIn;
						accField.value = { key, value: value.value };
						accumulator.properties.push(accField);
					}

					return { cursor, actor, accumulator, firstEvent, lastEvent };
				}),
				toArray()
			)
		),
		shareReplay(1)
	);

	public selectedActorAccumulatorAtCursor$: Observable<Accumulator> = combineLatest([
		this.actorDeltasAtCursor$,
		this.engineService.selected.pipe(
			filter(actorObject => actorObject !== undefined),
			map(actorObject => actorObject.actor)
		)
	]).pipe(
		map(([all, selected]) => all.find(acc => acc.actor.id === selected.id)),
		filter(delta => delta !== undefined)
	);

	private _vb = new Vector3();

	public actorDialogSubscription = this.actorFormSave
		.pipe(
			filter(data => data !== undefined),
			switchMap(({ actor, name, maxSpeed, date, knowledge, newKnowledge, color }) => {
				const wrapper = new UnixWrapper(Math.floor(date.unix()));
				const finalPosition = this.actorPositionAt(actor, wrapper.unix);
				const knowledgeMap = new Map<String, String | undefined>();
				knowledge
					.filter(e => e.value || e.forget)
					.map(k => {
						if (k.forget) {
							k.value = '';
						}
						return k;
					})
					.forEach(({ key, value }) => knowledgeMap.set(key, value));
				newKnowledge.filter(({ value }) => !!value).forEach(({ key, value }) => knowledgeMap.set(key, value));
				const delta = new ActorDelta(name ? name : undefined, finalPosition, knowledgeMap, maxSpeed, color);

				actor._states.set(wrapper, delta);

				return from(
					actor.atomicUpdate(a => {
						a._states = actor._states;
						return a;
					})
				).pipe(map(a => actor));
			}),
			tap(actor => refreshBlockOfActor(actor))
		)
		.subscribe();
	public maxPossiblePlanetRadius$ = this.databaseService.currentLoreActors$.pipe(
		mergeMap(actors =>
			of(...actors).pipe(
				mergeScan(
					(maxAcc, actor) =>
						of(...actor._states.nodes()).pipe(
							pairwise(),
							scan(
								(acc, [a, b]) => {
									if (a.value.maxSpeed !== undefined) {
										acc.lastMaxSpeed = a.value.maxSpeed;
									}
									this._va.copy(a.value.position as Vector3);
									this._vb.copy(b.value.position as Vector3);
									const time = Math.abs(b.key.unix - a.key.unix); // s
									const maxDistance = acc.lastMaxSpeed * (time / 3600); // km/h * h = km, arc-length
									const angle = this._va.angleTo(this._vb); // radian
									const maxRadius = maxDistance / angle; // km, radius
									if (acc.maxRadius >= maxRadius) {
										// Min search
										acc.maxRadius = maxRadius;
									}
									return acc;
								},
								{ lastMaxSpeed: Actor.DEFAULT_MAX_SPEED, maxRadius: Infinity }
							),
							map(({ maxRadius }) => (maxAcc > maxRadius ? maxRadius : maxAcc)) // the smallest maximum
						),
					Infinity
				)
			)
		),
		shareReplay(1)
	);

	public actorPositionAt(actor: RxDocument<Actor>, unix: number): Vector3Serializable {
		let finalPosition: Vector3Serializable;
		this._w.unix = unix;
		const enclosing = actor._states.enclosingNodes(this._w);
		if (enclosing.first === undefined || enclosing.last === undefined) {
			let node = enclosing.first;
			if (!node) {
				node = enclosing.last;
			}
			finalPosition = {
				x: node.value.position.x,
				y: node.value.position.y,
				z: node.value.position.z
			};
		} else {
			const progress = enclosingProgress(enclosing, unix);
			let worldPos: Vector3Serializable;

			if (enclosing.last) {
				worldPos = enclosing.last.value.position;
			}

			if (enclosing.first) {
				worldPos = enclosing.first.value.position;
			}

			if (enclosing.last && enclosing.first) {
				worldPos = this.lookAtInterpolated(
					enclosing.last.value.position,
					enclosing.first.value.position,
					progress
				);
			}
			finalPosition = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
		}
		return finalPosition;
	}

	public accumulatorOf(actor: RxDocument<Actor>): Observable<Accumulator> {
		return this.actorDeltasAtCursor$.pipe(
			map(actorAccs => actorAccs.find(actorAcc => actorAcc.actor.id === actor.id)),
			filter(accumulator => accumulator !== undefined)
		);
	}
}

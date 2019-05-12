import { Injectable } from '@angular/core';
import { Actor, ActorDelta, Lore } from '@app/model/data';
import { DatabaseService } from '@app/service/database.service';
import { LoreService } from '@app/service/lore.service';
import {
	createActorDelta, createActorDeltaSuccess,
	deleteActorDelta,
	deleteActorDeltaFailure,
	loadActorDeltasForActor,
	loadActorDeltasForActorFailure,
	loadActorDeltasForActorSuccess
} from '@lore/store/actions/actor-delta.actions';
import { ActorEntity, FeatureState } from '@lore/store/reducers';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, concat, merge, of } from 'rxjs';
import { catchError, flatMap, map, mergeMap, switchMap, take, withLatestFrom } from 'rxjs/operators';

import {
	createActorFailure,
	createActorSuccess,
	createLoreSuccess,
	deleteActorFailure,
	deleteActorSuccess,
	deleteLore,
	deleteLoreFailure,
	deleteLoreSuccess,
	FeatureActions,
	loadActors,
	loadActorsFailure,
	loadActorsSuccess,
	loadLoresFailure,
	loadLoresSuccess,
	Payload,
	updateActorFailure,
	updateActorSuccess,
	updateLoreSuccess,
	voidOperation
} from '../actions';

/**
 * Lore effects
 *
 * Whenever an action happens, these effects are what executing the tasks that you 'assign' end them here
 */
@Injectable()
export class ActorDeltaEffects {
	public constructor(
		private actions$: Actions<FeatureActions>,
		private store: Store<FeatureState>,
		private storeFacade: StoreFacade,
		private databaseService: DatabaseService
	) {}

	/**
	 * Database listeners on the Actor Delta Document
	 *
	 * When changing projects, this fires for each loaded actor one by one, collecting all the deltas
	 */
	private initialActorDeltas$ = combineLatest([
		this.databaseService.database$,
		this.actions$.pipe(ofType(loadActorDeltasForActor.type))
	]).pipe(
		switchMap(([db, { payload }]) =>
			db.delta.find({ actor: payload }).$.pipe(
				take(1),
				map(deltas => ({ deltas, forActor: { id: payload.id } }))
			)
		),
		map(({ deltas, forActor }) => ({
			deltas: deltas
				.map(
					actorDelta =>
						({
							id: actorDelta.id,
							actorId: actorDelta.actorId,
							unix: actorDelta.unix,
							name: actorDelta.name,
							maxSpeed: actorDelta.maxSpeed,
							color: actorDelta.color,
							position: { ...actorDelta.position },
							properties: [...actorDelta.properties]
						} as ActorDelta)
				)
				.sort((a, b) => a.unix - b.unix),
			forActor
		})),
		map(({ deltas, forActor}) =>
			loadActorDeltasForActorSuccess({ payload: { forActor, deltas } })
		), // The reducer will delete the actor (and delta) entity state before inserting these
		catchError(error => of(loadActorDeltasForActorFailure({ payload: error })))
	);

	private insertedActorDeltas$ = this.databaseService.database$.pipe(
		switchMap(db => db.delta.insert$),
		// withLatestFrom(),
		map(change => change.data.v),
		map(actorDelta => createActorDeltaSuccess({ payload: { forActor: { id: actorDelta.actorId }, delta: actorDelta } })),
		catchError(error => of(createActorFailure({ payload: error })))
	);

	private updatedActorDeltas$ = this.databaseService.database$.pipe(
		switchMap(db => db.actor.update$),
		map(change => change.data.v),
		map(actor => updateActorSuccess({ payload: actor })),
		catchError(error => of(updateActorFailure({ payload: error })))
	);

	private deletedActorDeltas$ = this.databaseService.database$.pipe(
		switchMap(db => db.actor.remove$),
		map(change => change.data.v),
		map(actor => deleteActorSuccess({ payload: { id: (actor as Actor).id } })),
		catchError(error => of(deleteActorFailure({ payload: error })))
	);

	@Effect()
	public actorDeltas$ = concat(
		this.initialActorDeltas$,
		merge(this.insertedActorDeltas$, this.updatedActorDeltas$, this.deletedActorDeltas$)
	);

	@Effect()
	public deleteLore$ = this.actions$.pipe(
		ofType(loadActorDeltasForActor.type),
		withLatestFrom(this.databaseService.database$),
		mergeMap(([ac, db]) => db.delta.find({ actorId: ac.payload.id }).$.pipe(take(1)))
	);

	/**
	 * When an actorDeltaDelete action comes in, remove from the database,
	 * then do nothing because the result will be handled from the database
	 */
	@Effect()
	private deleteActorDelta$ = this.actions$.pipe(
		ofType(deleteActorDelta.type),
		withLatestFrom(this.databaseService.database$),
		mergeMap(([{ payload }, db]) => db.delta.find({ id: payload.forActor.id }).$.pipe(take(1))),
		flatMap(actorDeltas => actorDeltas),
		mergeMap(actorDelta => actorDelta.remove()),
		map(actorDelta => voidOperation()),
		catchError(error => of(deleteActorDeltaFailure({ payload: error })))
	);
}

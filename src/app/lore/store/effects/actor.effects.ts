import { Injectable } from '@angular/core';
import { Actor, ActorDelta, Lore } from '@app/model/data';
import { DatabaseService } from '@app/service/database.service';
import { LoreService } from '@app/service/lore.service';
import {
	deleteActorDelta,
	deleteActorDeltaFailure,
	deleteActorDeltaSuccess,
	loadActorDeltasForActor,
	loadActorDeltasForActorFailure
} from '@lore/store/actions/actor-delta.actions';
import { ActorEntity, FeatureState } from '@lore/store/reducers';
import { makeInitialActorDeltaState } from '@lore/store/reducers/actor-delta.reducer';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { combineLatest, concat, merge, of } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { catchError, filter, flatMap, map, mergeMap, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { del } from 'selenium-webdriver/http';

import {
	createActorFailure,
	createActorSuccess,
	createLoreSuccess,
	deleteActorFailure,
	deleteActorSuccess,
	deleteLoreSuccess,
	FeatureActions,
	loadActors,
	loadActorsFailure,
	loadActorsSuccess,
	loadLoresFailure,
	loadLoresSuccess,
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
export class ActorEffects {
	public constructor(
		private actions$: Actions<FeatureActions>,
		private store: Store<FeatureState>,
		private storeFacade: StoreFacade,
		private databaseService: DatabaseService
	) {}

	/**
	 * Database listeners on the Actor Document
	 *
	 * Automatically issue the load style effects straight start the database, or when a new lore is selected. Only
	 * the selected lore's actors are present in the state
	 */
	private initialActors$ = combineLatest([
		this.databaseService.database$,
		this.storeFacade.selectedLore$.pipe(filter(selected => selected !== undefined))
	]).pipe(
		switchMap(([db, selectedLore]) => db.actor.find({ loreId: selectedLore.id }).$.pipe(take(1))),
		tap(a => console.log(a.map(ac => ac.toJSON()))),
		map(actors =>
			actors.map(
				actor =>
					({
						id: actor.id,
						deltas: makeInitialActorDeltaState(actor.id), // Will be uploaded by a delta side-effect
						_userdata: {},
						loreId: actor.loreId
					} as ActorEntity)
			)
		),
		map(actors => loadActorsSuccess({ payload: actors })), // The reducer will delete the actors entity state before inserting these
		catchError(error => of(loadActorsFailure({ payload: error })))
	);

	private insertedActors$ = this.databaseService.database$.pipe(
		switchMap(db => db.actor.insert$),
		map(
			change =>
				({
					id: change.data.v.id,
					deltas: makeInitialActorDeltaState(change.data.v.id), // Since it's new, it's gonna be empty anyway
					_userdata: {},
					loreId: change.data.v.loreId
				} as ActorEntity)
		),
		map(actor => createActorSuccess({ payload: actor })),
		catchError(error => of(createActorFailure({ payload: error })))
	);

	private updatedActors$ = this.databaseService.database$.pipe(
		// Won't ever trigger as this is only an intermediate object
		switchMap(db => db.actor.update$),
		map(change => change.data.v),
		map(actor => updateActorSuccess({ payload: actor })),
		catchError(error => of(updateActorFailure({ payload: error })))
	);

	private deletedActors$ = this.databaseService.database$.pipe(
		switchMap(db => db.actor.remove$),
		map(change => change.data.v),
		map(actor => deleteActorSuccess({ payload: { id: (actor as Actor).id } })),
		catchError(error => of(deleteActorFailure({ payload: error })))
	);

	@Effect()
	public actors$ = concat(this.initialActors$, merge(this.insertedActors$, this.updatedActors$, this.deletedActors$));

	/**
	 * Issues a delta load for each actor
	 */
	@Effect()
	public loadActorDeltas$ = this.actions$.pipe(
		ofType(loadActorsSuccess.type),
		flatMap(actors => actors.payload),
		map(actor => loadActorDeltasForActor({ payload: actor })),
		catchError(error => of(loadActorDeltasForActorFailure({ payload: error })))
	);
}

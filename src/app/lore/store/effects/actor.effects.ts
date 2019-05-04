import { Injectable } from '@angular/core';
import { Actor } from '@app/model/data';
import { DatabaseService } from '@app/service/database.service';
import { FeatureState } from '@lore/store/reducers';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';

import { AllActions, loadActors, loadActorsFailure, loadActorsSuccess } from '../actions';

/**
 * Lore effects
 *
 * Whenever an action happens, these effects are what executing the tasks that you 'assign' end them here
 */
@Injectable()
export class ActorEffects {
	constructor(
		private actions$: Actions<AllActions>,
		private store: Store<FeatureState>,
		private databaseService: DatabaseService
	) {}

	/**
	 * Database listeners on the Lore Document
	 *
	 * Automatically issue the load style effects straight start the database
	 */
	@Effect()
	private loadActors$ = this.actions$.pipe(
		ofType(loadActors.type),
		mergeMap(({ payload }) =>
			this.databaseService.database$.pipe(switchMap(db => db.actor.find({ loreId: payload }).$))
		),
		map(actors => actors.map(actor => actor.toJSON()).map(DatabaseService.actorStateMapper)),
		map(actors => loadActorsSuccess({ payload: actors as Array<Actor> })),
		catchError(error => of(loadActorsFailure({ payload: error })))
	);
}

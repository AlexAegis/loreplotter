import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';

import {
	createLore,
	_play,
	SceneActions,
	changeCursorBy,
	setPlaying,
	_stop,
	changeFrameBy,
	setContainerWidth,
	_timelineRefresh,
	changeSelectedLoreSuccess,
	changeSelectedLoreFailure,
	loadLoresSuccess,
	loadLoresFailure,
	changeSelectedLore,
	loadActorsSuccess,
	loadActorsFailure,
	ActorActions,
	AllActions, loadActors
} from '../actions';
import { LoreService } from '@app/service/lore.service';
import { DatabaseService } from '@app/service/database.service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Store } from '@ngrx/store';
import { FeatureState } from '@lore/store/reducers';
import { catchError, map, mergeMap, switchMap, switchMapTo, take, tap, withLatestFrom } from 'rxjs/operators';
import { merge, Observable, of, partition, timer } from 'rxjs';
import { Actor } from '@app/model/data';

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
		mergeMap(({ payload }) => this.databaseService.database$.pipe(switchMap(db => db.actor.find({ loreId: payload }).$))),
		map(actors => actors.map(actor => actor.toJSON()).map(DatabaseService.actorStateMapper)),
		map(actors => loadActorsSuccess({ payload: actors as Array<Actor> })),
		catchError(error => of(loadActorsFailure({ payload: error })))
	);
}

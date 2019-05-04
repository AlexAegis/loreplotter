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
	_timelineRefresh
} from '../actions';
import { LoreService } from '@app/service/lore.service';
import { DatabaseService } from '@app/service/database.service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Store } from '@ngrx/store';
import { FeatureState } from '@lore/store/reducers';
import {
	distinctUntilChanged,
	filter,
	map,
	mapTo,
	switchMap,
	switchMapTo,
	takeUntil,
	tap,
	withLatestFrom
} from 'rxjs/operators';
import { merge, Observable, partition, timer } from 'rxjs';

/**
 * Lore effects
 *
 * Whenever an action happens, these effects are what executing the tasks that you 'assign' end them here
 */
@Injectable()
export class SceneEffects {
	constructor(
		private actions$: Actions<SceneActions>,
		private store: Store<FeatureState>,
		private loreService: LoreService,
		private storeFacade: StoreFacade
	) {}

	@Effect()
	public play$ = this.actions$.pipe(
		ofType(setPlaying.type),
		filter(({ payload }) => !!payload),
		map(payload => _play(payload))
	);

	@Effect()
	public stop$ = this.actions$.pipe(
		ofType(setPlaying.type),
		filter(({ payload }) => !payload),
		map(payload => _stop(payload))
	);

	@Effect()
	public doPlay$ = this.actions$.pipe(
		ofType(_play.type),
		withLatestFrom(this.storeFacade.cursorUnixOverride$),
		filter(([time, override]) => !override),
		switchMapTo(timer(0, 1000 / 60).pipe(takeUntil(this.actions$.pipe(ofType(_stop.type))))),
		withLatestFrom(this.storeFacade.playSpeed$),
		map(([time, speed]) => changeCursorBy({ payload: speed }))
	);
}

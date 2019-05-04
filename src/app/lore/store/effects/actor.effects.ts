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
export class ActorEffects {
	constructor(private actions$: Actions<SceneActions>, private store: Store<FeatureState>) {}
}

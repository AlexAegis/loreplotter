import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Math as ThreeMath } from 'three';
import {
	_play,
	SceneActions,
	changeCursorBy,
	setPlaying,
	_stop,
	setFrameTo
} from '../actions';
import { LoreService } from '@app/service/lore.service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Store } from '@ngrx/store';
import { FeatureState } from '@lore/store/reducers';
import {
	auditTime,
	filter,
	map,
	switchMapTo,
	takeUntil,
	throttleTime,
	withLatestFrom
} from 'rxjs/operators';
import { timer } from 'rxjs';
import { tweenMap } from '@app/operator';
import { Easing } from '@tweenjs/tween.js';

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

	private doPlay$ = this.actions$.pipe(
		ofType(_play.type),
		withLatestFrom(this.storeFacade.cursorUnixOverride$),
		filter(([time, override]) => !override),
		switchMapTo(timer(0, 1000 / 60).pipe(takeUntil(this.actions$.pipe(ofType(_stop.type))))),
		withLatestFrom(this.storeFacade.playSpeed$)
	);

	@Effect()
	public playCursor = this.doPlay$.pipe(map(([time, speed]) => changeCursorBy({ payload: speed })));

	@Effect()
	public autoFrame = this.doPlay$.pipe(
		withLatestFrom(this.storeFacade.frame$, this.storeFacade.cursorUnix$),
		map(([[time, speed], frame, cursor]) => ({
			frame,
			speed,
			progress: ThreeMath.mapLinear(cursor, frame.start, frame.end, 0, 1)
		})),
		map(({ frame, speed, progress }) => {
			if (speed > 0 && progress > 0.85) {
				return { frame, direction: 1 };
			} else if (speed < 0 && progress < 0.15) {
				return { frame, direction: -1 };
			} else {
				return undefined;
			}
		}),
		filter(autoJumpDirection => autoJumpDirection !== undefined),
		throttleTime(500),
		map(({ frame, direction }) => {
			return {
				from: { base: frame.start, length: frame.length },
				to: {
					base: frame.start + direction * frame.length * 0.5,
					length: frame.length
				}
			};
		}),
		tweenMap({
			duration: 500,
			easing: Easing.Exponential.Out,
			pingpongInterrupt: true,
			pingpongAfterFinish: true
		}),
		auditTime(1000 / 60),
		map(({ base, length }) => setFrameTo({payload: {start: base, end: base+length}}))
	);
}

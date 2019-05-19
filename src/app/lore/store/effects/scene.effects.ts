import { Injectable } from '@angular/core';
import { refreshBlockOfActor } from '@app/function/refresh-block-component.function';
import { toUnit } from '@app/function/to-unit.function';
import { ActorDelta, UnixWrapper } from '@app/model/data';
import { tweenMap } from '@app/operator';
import { LoreService } from '@app/service';
import { FeatureState } from '@lore/store/reducers';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Easing } from '@tweenjs/tween.js';
import { merge, of, timer } from 'rxjs';
import {
	auditTime,
	catchError,
	filter,
	map,
	mergeMapTo,
	switchMap,
	switchMapTo,
	takeUntil,
	tap,
	throttleTime,
	withLatestFrom
} from 'rxjs/operators';
import { Math as ThreeMath } from 'three';
import {
	_play,
	_stop,
	actorSpawnOnWorld,
	changeCursorBy,
	SceneActions,
	setFrameTo,
	setPlaying,
	setPlayingFailure,
	setPlayingSuccess,
	togglePlaying
} from '../actions';

/**
 * Scene effects
 */
@Injectable()
export class SceneEffects {
	@Effect()
	public autoFrame = merge(
		this.loreService.easeCursorToUnix.pipe(map(target => [target, 1, target])),
		this.doPlay$
	).pipe(
		withLatestFrom(this.storeFacade.frame$, this.storeFacade.cursor$),
		map(([[time, speed, easeTarget], frame, cursor]) => ({
			frame,
			progress: ThreeMath.mapLinear(easeTarget !== undefined ? easeTarget : cursor, frame.start, frame.end, 0, 1),
			targetFrame: {
				start:
					easeTarget !== undefined
						? easeTarget - frame.length * 0.5
						: frame.start + frame.length * 0.5 * (toUnit(speed) || 1),
				end:
					easeTarget !== undefined
						? easeTarget + frame.length * 0.5
						: frame.end + frame.length * 0.5 * (toUnit(speed) || 1),
				length: frame.length
			}
		})),
		filter(({ progress }) => progress < 0.15 || progress > 0.85),
		throttleTime(500),
		map(({ frame, targetFrame }) => {
			return {
				from: { base: frame.start, length: frame.length },
				to: {
					base: targetFrame.start,
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
		map(({ base, length }) => setFrameTo({ payload: { start: base, end: base + length } }))
	);

	@Effect()
	public setPlay$ = this.actions$.pipe(
		ofType(setPlaying.type),
		map(payload => setPlayingSuccess(payload)),
		catchError(payload => of(setPlayingFailure({ payload: payload })))
	);

	@Effect()
	public toggle$ = this.actions$.pipe(
		ofType(togglePlaying.type),
		mergeMapTo(this.storeFacade.isPlaying$),
		map(payload => setPlayingSuccess({ payload }))
	);

	@Effect()
	public play$ = this.actions$.pipe(
		ofType(setPlayingSuccess.type),
		filter(({ payload }) => !!payload),
		map(payload => _play(payload))
	);

	@Effect()
	public stop$ = this.actions$.pipe(
		ofType(setPlayingSuccess.type),
		filter(({ payload }) => !payload),
		map(payload => _stop(payload))
	);

	private doPlay$ = this.actions$.pipe(
		ofType(_play.type),
		withLatestFrom(this.storeFacade.cursorOverride$),
		filter(([time, override]) => !override),
		switchMapTo(timer(0, 1000 / 60).pipe(takeUntil(this.actions$.pipe(ofType(_stop.type))))),
		withLatestFrom(this.storeFacade.playSpeed$)
	);

	@Effect()
	public playCursor = this.doPlay$.pipe(map(([time, speed]) => changeCursorBy({ payload: speed })));

	public constructor(
		private actions$: Actions<SceneActions>,
		private store: Store<FeatureState>,
		private storeFacade: StoreFacade,
		private loreService: LoreService
	) {
	}

	@Effect({ dispatch: false })
	public spawnOnWorld = this.actions$.pipe(
		ofType(actorSpawnOnWorld.type),
		tap(e => console.log(e)),
		withLatestFrom(this.storeFacade.cursor$),
		switchMap(async ([{ payload }, cursor]) => {
			payload.actorObject.applyQuaternion(payload.actorObject.globe.quaternion.clone().inverse());
			payload.actorObject.actor._states.set(
				new UnixWrapper(cursor),
				new ActorDelta(undefined, {
					x: payload.position.x,
					y: payload.position.y,
					z: payload.position.z
				})
			);
			const updatedActor = await payload.actorObject.actor.atomicUpdate(
				a => (a._states = payload.actorObject.actor._states) && a
			);
			payload.actorObject.parent.userData.override = false;
			refreshBlockOfActor(payload.actorObject.actor);
			return updatedActor;
		})
	);
}

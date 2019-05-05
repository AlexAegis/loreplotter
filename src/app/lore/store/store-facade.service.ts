import { Injectable } from '@angular/core';

import { Lore } from '@app/model/data';
import { ActorFormResultData } from '@lore/component';
import { actorQuery } from '@lore/store/selectors/actor.selectors';
import { Actions, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import {
	bakeCursorOverride,
	bakeFrame,
	bakeFrameEnd,
	bakeFrameStart,
	changeCursorBy,
	changeCursorOverrideTo,
	changeFrameBy,
	changeSelectedLore,
	clearCursorOverride,
	createLore,
	createLoreFailure,
	createLoreSuccess,
	deleteLore,
	deleteLoreFailure,
	deleteLoreSuccess,
	FeatureActions,
	loadLoresFailure,
	loadLoresSuccess,
	setAutoLight,
	setDrawHeight,
	setDrawSize,
	setFrameDeltaTo,
	setFrameEndDeltaTo,
	setFrameEndTo,
	setFrameStartDeltaTo,
	setFrameStartTo,
	setFrameTo,
	setInteractionMode,
	setManualLightAlwaysOn,
	setPlaySpeed,
	toggleAutoLight,
	toggleManualLightAlwaysOn,
	togglePlaying,
	updateActor,
	updateLore,
	updateLoreFailure,
	updateLoreSuccess
} from './actions';
import { AppState, InteractionMode } from './reducers';
import { loreQuery, sceneQuery } from './selectors';

@Injectable()
export class StoreFacade {
	// Project
	public lores$ = this.store$.pipe(select(loreQuery.getLores));
	public selectedLore$ = this.store$.pipe(
		select(loreQuery.selected.getSelected),
		filter(selected => selected !== undefined)
	);
	public selectedLorePlanet$ = this.store$.pipe(
		select(loreQuery.selected.getSelectedPlanet),
		filter(selected => selected !== undefined)
	);
	public loadLoresSuccess$ = this.actions$.pipe(ofType(loadLoresSuccess.type));
	public loadLoresFail$ = this.actions$.pipe(ofType(loadLoresFailure.type));
	public createLoresSuccess$ = this.actions$.pipe(ofType(createLoreSuccess.type));
	public createLoresFail$ = this.actions$.pipe(ofType(createLoreFailure.type));
	public updateLoresSuccess$ = this.actions$.pipe(ofType(updateLoreSuccess.type));
	public updateLoresFail$ = this.actions$.pipe(ofType(updateLoreFailure.type));
	public deleteLoresSuccess$ = this.actions$.pipe(ofType(deleteLoreSuccess.type));
	public deleteLoresFail$ = this.actions$.pipe(ofType(deleteLoreFailure.type));
	// Scene
	public playSpeed$ = this.store$.pipe(select(sceneQuery.play.getPlaySpeed));
	public isPlaying$ = this.store$.pipe(select(sceneQuery.play.isPlaying));
	// Cursor
	public cursor$ = this.store$.pipe(select(sceneQuery.cursor.getCursor));
	public cursorOverride$ = this.store$.pipe(select(sceneQuery.cursor.getCursorOverride));
	public frame$ = this.store$.pipe(select(sceneQuery.frame.getFrame));
	// Interaction
	public interactionMode$ = this.store$.pipe(select(sceneQuery.interaction.getInteractionMode));
	public drawSize$ = this.store$.pipe(select(sceneQuery.interaction.getDrawSize));
	public drawHeight$ = this.store$.pipe(select(sceneQuery.interaction.getDrawHeight));
	public manualLight$ = this.store$.pipe(select(sceneQuery.interaction.isManualLight));
	public manualLightAlwaysOn$ = this.store$.pipe(select(sceneQuery.interaction.isManualLightAlwaysOn));
	// Actors
	public actors$ = this.store$.pipe(select(actorQuery.getActors));

	public constructor(private store$: Store<AppState>, private actions$: Actions<FeatureActions>) {}

	public create(lore: Lore): void {
		this.store$.dispatch(createLore({ lore }));
	}

	public update(lore: Lore): void {
		this.store$.dispatch(updateLore({ payload: { id: '', changes: lore } }));
	}

	public delete(id: string): void {
		this.store$.dispatch(deleteLore({ id }));
	}

	public selectLore(lore: Partial<Lore>): void {
		this.store$.dispatch(changeSelectedLore({ payload: lore }));
	}

	public setPlaySpeed(speed: number): void {
		this.store$.dispatch(setPlaySpeed({ payload: speed }));
	}

	public togglePlay(): void {
		this.store$.dispatch(togglePlaying({ payload: undefined }));
	}

	public bakeCursorOverride(): void {
		this.store$.dispatch(bakeCursorOverride({ payload: true }));
	}

	public clearCursorOverride(): void {
		this.store$.dispatch(clearCursorOverride({ payload: undefined }));
	}

	public setCursorOverride(to: number): void {
		this.store$.dispatch(changeCursorOverrideTo({ payload: to }));
	}

	public setCursor(to: number): void {
		this.store$.dispatch(changeCursorOverrideTo({ payload: to }));
	}

	public setFrameStart(to: number): void {
		this.store$.dispatch(setFrameStartTo({ payload: to }));
	}

	public setFrameEnd(to: number): void {
		this.store$.dispatch(setFrameEndTo({ payload: to }));
	}

	public setFrame(to: { start: number; end: number }): void {
		this.store$.dispatch(setFrameTo({ payload: to }));
	}

	public setFrameStartDelta(to: number): void {
		this.store$.dispatch(setFrameStartDeltaTo({ payload: to }));
	}

	public setFrameEndDelta(to: number): void {
		this.store$.dispatch(setFrameEndDeltaTo({ payload: to }));
	}

	public setFrameDelta(startTo: number, endTo: number = startTo): void {
		this.store$.dispatch(setFrameDeltaTo({ payload: { start: startTo, end: endTo } }));
	}

	public bakeFrame(): void {
		this.store$.dispatch(bakeFrame({ payload: true }));
	}

	public bakeFrameStart(): void {
		this.store$.dispatch(bakeFrameStart({ payload: true }));
	}

	public bakeFrameEnd(): void {
		this.store$.dispatch(bakeFrameEnd({ payload: true }));
	}

	public changeFrameBy(to: { start: number; end: number }): void {
		this.store$.dispatch(changeFrameBy({ payload: to }));
	}

	public changeCursorBy(speed: number): void {
		this.store$.dispatch(changeCursorBy({ payload: speed }));
	}

	public setInteractionMode(mode: InteractionMode): void {
		this.store$.dispatch(setInteractionMode({ payload: mode }));
	}

	public setDrawSize(size: number): void {
		this.store$.dispatch(setDrawSize({ payload: size }));
	}

	public setDrawHeight(height: number): void {
		this.store$.dispatch(setDrawHeight({ payload: height }));
	}

	public setAutoLight(on: boolean): void {
		this.store$.dispatch(setAutoLight({ payload: on }));
	}

	public setManualLightAlwaysOn(on: boolean): void {
		this.store$.dispatch(setManualLightAlwaysOn({ payload: on }));
	}

	public toggleManualLightAlwaysOn(): void {
		this.store$.dispatch(toggleManualLightAlwaysOn());
	}

	public toggleAutoLight(): void {
		this.store$.dispatch(toggleAutoLight());
	}

	public updateActor(formData: ActorFormResultData): void {
		this.store$.dispatch(updateActor({ payload: formData }));
	}
}

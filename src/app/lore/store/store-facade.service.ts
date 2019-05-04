import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { Lore } from '@app/model/data';
import { LoreState, FeatureState, AppState, InteractionMode } from './reducers';
import { loreQuery, sceneQuery } from './selectors';
import {
	LoreActions,
	loadLores,
	createLore,
	updateLore,
	deleteLore,
	loadLoresFailure,
	loadLoresSuccess,
	deleteLoreSuccess,
	updateLoreFailure,
	updateLoreSuccess,
	createLoreFailure,
	createLoreSuccess,
	deleteLoreFailure,
	changeSelectedLore,
	AllActions,
	setPlaySpeed,
	setPlaying,
	bakeCursorOverride,
	changeCursorOverrideTo,
	setFrameStartTo,
	setFrameStartDeltaTo,
	setFrameEndDeltaTo,
	setFrameDeltaTo,
	bakeFrame,
	bakeFrameStart,
	bakeFrameEnd,
	setFrameEndTo,
	setFrameTo,
	changeFrameBy,
	changeCursorBy,
	moveNode,
	setInteractionMode,
	setAutoLight,
	setDrawHeight,
	setDrawSize,
	setManualLightAlwaysOn,
	toggleManualLightAlwaysOn,
	toggleAutoLight
} from './actions';
import { filter, first, map, mapTo, mergeMap, share, shareReplay, tap } from 'rxjs/operators';
import { actorQuery } from '@lore/store/selectors/actor.selectors';
import { combineLatest } from 'rxjs';

@Injectable()
export class StoreFacade {
	// Project
	public lores$ = this.store$.pipe(select(loreQuery.getLores));
	public selectedLoreId$ = this.store$.pipe(select(loreQuery.getSelectedId));
	public selectedLore$ = this.store$.pipe(
		select(loreQuery.getSelected),
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
	public playSpeed$ = this.store$.pipe(select(sceneQuery.getPlaySpeed));
	public isPlaying$ = this.store$.pipe(select(sceneQuery.isPlaying));
	public cursorUnix$ = this.store$.pipe(select(sceneQuery.getCursorUnix));
	public cursorUnixOverride$ = this.store$.pipe(select(sceneQuery.getCursorUnixOverride));
	public cursorBasePosition$ = this.store$.pipe(select(sceneQuery.getCursorBasePosition));
	public cursorPosition$ = this.store$.pipe(select(sceneQuery.getCursorPosition));
	public frame$ = this.store$.pipe(select(sceneQuery.getFrame));
	public frameStart$ = this.store$.pipe(select(sceneQuery.getFrameStart));
	public frameEnd$ = this.store$.pipe(select(sceneQuery.getFrameEnd));

	public interactionMode$ = this.store$.pipe(select(sceneQuery.getInteractionMode));
	public drawSize$ = this.store$.pipe(select(sceneQuery.getDrawSize));
	public drawHeight$ = this.store$.pipe(select(sceneQuery.getDrawHeight));
	public manualLight$ = this.store$.pipe(select(sceneQuery.isManualLight));
	public manualLightAlwaysOn$ = this.store$.pipe(select(sceneQuery.isManualLightAlwaysOn));
	// Actors
	public actors$ = this.store$.pipe(select(actorQuery.getActors));

	constructor(private store$: Store<AppState>, private actions$: Actions<AllActions>) {
		console.log('StoreFacade created');
	}

	/**
	 * Create
	 * @param lore Lore
	 */
	public create(lore: Lore) {
		this.store$.dispatch(createLore({ lore }));
	}

	/**
	 * Update
	 * @param lore Lore
	 */
	public update(lore: Lore) {
		this.store$.dispatch(updateLore({ payload: { id: '', changes: lore } }));
	}

	/**
	 * Delete
	 * @param id ID
	 */
	public delete(id: string) {
		this.store$.dispatch(deleteLore({ id }));
	}

	public selectLore(lore: Partial<Lore>) {
		this.store$.dispatch(changeSelectedLore({ payload: lore }));
	}

	public setPlaySpeed(speed: number) {
		this.store$.dispatch(setPlaySpeed({ payload: speed }));
	}

	/**
	 * Simplify
	 */
	public togglePlay() {
		this.isPlaying$.pipe(first()).subscribe(isPlaying => {
			this.store$.dispatch(setPlaying({ payload: !isPlaying }));
		});
	}

	public bakeCursorOverride() {
		this.store$.dispatch(bakeCursorOverride({ payload: true }));
	}

	public setCursorOverride(to: number) {
		this.store$.dispatch(changeCursorOverrideTo({ payload: to }));
	}

	public setCursor(to: number) {
		this.store$.dispatch(changeCursorOverrideTo({ payload: to }));
	}

	public setFrameStart(to: number) {
		this.store$.dispatch(setFrameStartTo({ payload: to }));
	}

	public setFrameEnd(to: number) {
		this.store$.dispatch(setFrameEndTo({ payload: to }));
	}

	public setFrame(to: { start: number; end: number }) {
		this.store$.dispatch(setFrameTo({ payload: to }));
	}

	public setFrameStartDelta(to: number) {
		this.store$.dispatch(setFrameStartDeltaTo({ payload: to }));
	}

	public setFrameEndDelta(to: number) {
		this.store$.dispatch(setFrameEndDeltaTo({ payload: to }));
	}

	public setFrameDelta(startTo: number, endTo: number = startTo) {
		this.store$.dispatch(setFrameDeltaTo({ payload: { start: startTo, end: endTo } }));
	}

	public bakeFrame() {
		this.store$.dispatch(bakeFrame({ payload: true }));
	}

	public bakeFrameStart() {
		this.store$.dispatch(bakeFrameStart({ payload: true }));
	}

	public bakeFrameEnd() {
		this.store$.dispatch(bakeFrameEnd({ payload: true }));
	}

	public changeFrameBy(to: { start: number; end: number }) {
		this.store$.dispatch(changeFrameBy({ payload: to }));
	}

	public changeCursorBy(speed: number) {
		this.store$.dispatch(changeCursorBy({ payload: speed }));
	}

	public moveNode(original: number, from: number, to: number) {
		this.store$.dispatch(moveNode({ payload: { original, from, to } }));
	}

	public setInteractionMode(mode: InteractionMode) {
		this.store$.dispatch(setInteractionMode({ payload: mode }));
	}

	public setDrawSize(size: number) {
		this.store$.dispatch(setDrawSize({ payload: size }));
	}

	public setDrawHeight(height: number) {
		this.store$.dispatch(setDrawHeight({ payload: height }));
	}

	public setAutoLight(on: boolean) {
		this.store$.dispatch(setAutoLight({ payload: on }));
	}

	public setManualLightAlwaysOn(on: boolean) {
		this.store$.dispatch(setManualLightAlwaysOn({ payload: on }));
	}

	public toggleManualLightAlwaysOn() {
		this.store$.dispatch(toggleManualLightAlwaysOn());
	}

	public toggleAutoLight() {
		this.store$.dispatch(toggleAutoLight());
	}
}

import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { Lore } from '@app/model/data';
import { LoreState, FeatureState, AppState } from './reducers';
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
	changeCursorBy
} from './actions';
import { first } from 'rxjs/operators';

@Injectable()
export class StoreFacade {
	// lore
	public lores$ = this.store.pipe(select(loreQuery.getLores));
	public selectedLore$ = this.store.pipe(select(loreQuery.getSelected));
	public loadLoresSuccess$ = this.actions$.pipe(ofType(loadLoresSuccess.type));
	public loadLoresFail$ = this.actions$.pipe(ofType(loadLoresFailure.type));
	public createLoresSuccess$ = this.actions$.pipe(ofType(createLoreSuccess.type));
	public createLoresFail$ = this.actions$.pipe(ofType(createLoreFailure.type));
	public updateLoresSuccess$ = this.actions$.pipe(ofType(updateLoreSuccess.type));
	public updateLoresFail$ = this.actions$.pipe(ofType(updateLoreFailure.type));
	public deleteLoresSuccess$ = this.actions$.pipe(ofType(deleteLoreSuccess.type));
	public deleteLoresFail$ = this.actions$.pipe(ofType(deleteLoreFailure.type));
	// scene from store
	public playSpeed$ = this.store.pipe(select(sceneQuery.getPlaySpeed));
	public isPlaying$ = this.store.pipe(select(sceneQuery.isPlaying));
	public cursorUnix$ = this.store.pipe(select(sceneQuery.getCursorUnix));
	public cursorUnixOverride$ = this.store.pipe(select(sceneQuery.getCursorUnixOverride));
	public cursorBasePosition$ = this.store.pipe(select(sceneQuery.getCursorBasePosition));
	public cursorPosition$ = this.store.pipe(select(sceneQuery.getCursorPosition));
	public frame$ = this.store.pipe(select(sceneQuery.getFrame));
	public frameStart$ = this.store.pipe(select(sceneQuery.getFrameStart));
	public frameEnd$ = this.store.pipe(select(sceneQuery.getFrameEnd));

	constructor(private store: Store<AppState>, private actions$: Actions<AllActions>) {
		console.log('StoreFacade created');
	}

	/**
	 * Create
	 * @param lore Lore
	 */
	public create(lore: Lore) {
		this.store.dispatch(createLore({ lore }));
	}

	/**
	 * Update
	 * @param lore Lore
	 */
	public update(lore: Lore) {
		this.store.dispatch(updateLore({ payload: { id: '', changes: lore } }));
	}

	/**
	 * Delete
	 * @param id ID
	 */
	public delete(id: string) {
		this.store.dispatch(deleteLore({ id }));
	}

	public selectLore(lore: Partial<Lore>) {
		this.store.dispatch(changeSelectedLore({ payload: lore }));
	}

	public setPlaySpeed(speed: number) {
		this.store.dispatch(setPlaySpeed({ payload: speed }));
	}

	/**
	 * Simplify
	 */
	public togglePlay() {
		this.isPlaying$.pipe(first()).subscribe(isPlaying => {
			this.store.dispatch(setPlaying({ payload: !isPlaying }));
		});
	}

	public bakeCursorOverride() {
		this.store.dispatch(bakeCursorOverride({ payload: true }));
	}

	public setCursorOverride(to: number) {
		this.store.dispatch(changeCursorOverrideTo({ payload: to }));
	}

	public setCursor(to: number) {
		this.store.dispatch(changeCursorOverrideTo({ payload: to }));
	}

	public setFrameStart(to: number) {
		this.store.dispatch(setFrameStartTo({ payload: to }));
	}

	public setFrameEnd(to: number) {
		this.store.dispatch(setFrameEndTo({ payload: to }));
	}

	public setFrame(to: { start: number, end: number }) {
		this.store.dispatch(setFrameTo({ payload: to }));
	}

	public setFrameStartDelta(to: number) {
		this.store.dispatch(setFrameStartDeltaTo({ payload: to }));
	}

	public setFrameEndDelta(to: number) {
		this.store.dispatch(setFrameEndDeltaTo({ payload: to }));
	}

	public setFrameDelta(startTo: number, endTo: number = startTo) {
		this.store.dispatch(setFrameDeltaTo({ payload: { start: startTo, end: endTo } }));
	}

	public bakeFrame() {
		this.store.dispatch(bakeFrame({ payload: true }));
	}

	public bakeFrameStart() {
		this.store.dispatch(bakeFrameStart({ payload: true }));
	}

	public bakeFrameEnd() {
		this.store.dispatch(bakeFrameEnd({ payload: true }));
	}

	public changeFrameBy(to: { start: number, end: number}) {
		this.store.dispatch(changeFrameBy({ payload: to }));
	}

	public changeCursorBy(speed: number) {
		this.store.dispatch(changeCursorBy({ payload: speed }));
	}
}

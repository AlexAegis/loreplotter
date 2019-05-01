import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { Lore } from '@app/model/data';
import { State } from './reducers';
import { loreQuery } from './selectors';
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
	deleteLoreFailure
} from './actions';

@Injectable()
export class LoreFacade {
	public lores$ = this.store.pipe(select(loreQuery.getLores));
	public loadLoresSuccess$ = this.actions$.pipe(ofType(loadLoresSuccess.type));
	public loadLoresFail$ = this.actions$.pipe(ofType(loadLoresFailure.type));
	public createLoresSuccess$ = this.actions$.pipe(ofType(createLoreSuccess.type));
	public createLoresFail$ = this.actions$.pipe(ofType(createLoreFailure.type));
	public updateLoresSuccess$ = this.actions$.pipe(ofType(updateLoreSuccess.type));
	public updateLoresFail$ = this.actions$.pipe(ofType(updateLoreFailure.type));
	public deleteLoresSuccess$ = this.actions$.pipe(ofType(deleteLoreSuccess.type));
	public deleteLoresFail$ = this.actions$.pipe(ofType(deleteLoreFailure.type));

	constructor(private store: Store<State>, private actions$: Actions<LoreActions>) {}

	/**
	 * Load all lores into the store
	 */
	public loadAll() {
		this.store.dispatch(loadLores());
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

}

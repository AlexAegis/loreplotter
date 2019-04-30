import { Injectable } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';

import { Lore } from '@app/model';
import { State } from './reducers';
import { loreQuery } from './selectors';
import { LoreActions, loadLores } from './actions';

// TODO Consider renaming this to LoreStore. Just for the gigs.
@Injectable()
export class LoreFacade {
	loading$ = this.store.pipe(select(loreQuery.getLoading));
	todos$ = this.store.pipe(select(loreQuery.getLores));
	/*	loadTodosSuccess$ = this.actions$.pipe(ofType(loadTodosSuccess.type));
	loadTodosFail$ = this.actions$.pipe(ofType(loadTodosFailure.type));
	createTodoSuccess$ = this.actions$.pipe(ofType(createTodoSuccess.type));
	createTodoFail$ = this.actions$.pipe(ofType(createTodoFailure.type));
	updateTodoSuccess$ = this.actions$.pipe(ofType(updateTodoSuccess.type));
	updateTodoFail$ = this.actions$.pipe(ofType(updateTodoFailure.type));
	deleteTodoSuccess$ = this.actions$.pipe(ofType(deleteTodoSuccess.type));
	deleteTodoFail$ = this.actions$.pipe(ofType(deleteTodoFailure.type));*/

	constructor(private store: Store<State>, private actions$: Actions<LoreActions>) {}

	/**
	 * Find all
	 * @param offset Offset
	 * @param limit Limit
	 */
	findAll(offset?: number, limit?: number) {
		this.store.dispatch(loadLores({ offset }));
	} /*
	create(lore: Partial<Lore>) {
		this.store.dispatch(createLore({ lore }));
	}*/ /*
	update(lore: Lore) {
		this.store.dispatch(
			updateLore({
				todo: {
					id: lore.id,
					changes: lore
				}
			})
		);
	}*/ /*
	delete(id: string) {
		this.store.dispatch(deleteLore({ id }));
	}*/

	/**
	 * Create
	 * @param todo Lore
	 */

	/**
	 * Update
	 * @param lore Lore
	 */

	/**
	 * Delete
	 * @param id ID
	 */
}

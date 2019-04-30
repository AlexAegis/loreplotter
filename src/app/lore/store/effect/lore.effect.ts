import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, concatMap, switchMap, catchError } from 'rxjs/operators';

import { LoreActions, loadLores } from '../actions';
import { LoreService } from '@app/service/lore.service';
import { DatabaseService } from '@app/service/database.service';

/**
 * Lore effects
 */
@Injectable()
export class LoreEffect {
	constructor(
		private actions$: Actions<LoreActions>,
		private loreService: LoreService,
		private databaseService: DatabaseService
	) {}

	/**
	 * Load lores
	 */
	@Effect()
	loadLores$ = this.actions$.pipe(
		ofType(loadLores.type)
		/*switchMap(action => {
			const { offset, limit } = action.payload;
			return databaseService.
			return this.loreService.findAll(offset, limit).pipe(
				map(result => loadTodosSuccess({ todos: result })),
				catchError(error => of(loadTodosFailure({ error })))
			);
		})*/
	);
}

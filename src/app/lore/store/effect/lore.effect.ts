import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, concat, merge } from 'rxjs';
import { map, switchMap, catchError, tap, flatMap, take } from 'rxjs/operators';

import {
	createLore,
	loadLoresSuccess,
	createLoreFailure,
	createLoreSuccess,
	deleteLoreSuccess,
	LoreActions,
	Payload,
	updateLoreSuccess,
	voidOperation,
	loadLoresFailure
} from '../actions';
import { LoreService } from '@app/service/lore.service';
import { DatabaseService } from '@app/service/database.service';
import { Lore } from '@app/model/data';

/**
 * Lore effects
 *
 * Whenever an action happens, these effects are what executing the tasks that you 'assign' to them here
 */
@Injectable()
export class LoreEffect {
	constructor(
		private actions$: Actions<LoreActions>,
		private loreService: LoreService,
		private databaseService: DatabaseService
	) {}

	/**
	 * Database listeners on the Lore Document
	 *
	 * Automatically issue the load style effects straight from the database
	 */
	private initialLores$ = this.databaseService.database$.pipe(
		switchMap(db => db.lore.find().$),
		take(1),
		map(lores => lores.map(lore => lore.toJSON())),
		map(lores => loadLoresSuccess({ payload: lores })),
		catchError(error => of(loadLoresFailure({ payload: error })))
	);

	private insertedLores$ = this.databaseService.database$.pipe(
		switchMap(db => db.lore.insert$),
		map(change => change.data.v),
		map(lore => createLoreSuccess({ payload: lore }))
	);

	private updatedLores$ = this.databaseService.database$.pipe(
		switchMap(db => db.lore.update$),
		map(change => change.data.v),
		map(lore => updateLoreSuccess({ payload: { id: lore.name, changes: lore } }))
	);

	private deletedLores$ = this.databaseService.database$.pipe(
		switchMap(db => db.lore.remove$),
		map(change => change.data.v),
		map(lore => deleteLoreSuccess(lore))
	);

	@Effect()
	public allLores$ = concat(this.initialLores$, merge(this.insertedLores$, this.updatedLores$, this.deletedLores$));

	/**
	 * Create
	 */
	@Effect()
	createLore$ = this.actions$.pipe(
		ofType(createLore.type),
		switchMap(({ payload }: Payload<Lore>) =>
			this.loreService.create(payload).pipe(
				map(a => voidOperation()), // The successful result will be handled by the listeners on the database
				catchError(error => of(createLoreFailure({ error })))
			)
		)
	);

}

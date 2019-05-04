import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of, concat, merge, iif } from 'rxjs';
import {
	map,
	switchMap,
	catchError,
	tap,
	flatMap,
	take,
	distinct,
	distinctUntilChanged,
	withLatestFrom,
	mergeMap, takeLast
} from 'rxjs/operators';

import {
	createLore,
	loadLoresSuccess,
	createLoreFailure,
	createLoreSuccess,
	deleteLoreSuccess,
	LoreActions,
	updateLoreSuccess,
	voidOperation,
	loadLoresFailure,
	changeSelectedLore,
	changeSelectedLoreFailure,
	changeSelectedLoreSuccess,
	AllActions, loadActors
} from '../actions';
import { LoreService } from '@app/service/lore.service';
import { DatabaseService } from '@app/service/database.service';
import { Lore } from '@app/model/data';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Store } from '@ngrx/store';
import { FeatureState } from '@lore/store/reducers';
import { Payload } from '@lore/store/actions/payload.interface';

/**
 * Lore effects
 *
 * Whenever an action happens, these effects are what executing the tasks that you 'assign' end them here
 */
@Injectable()
export class LoreEffects {
	constructor(
		private actions$: Actions<AllActions>,
		private store: Store<FeatureState>,
		private loreService: LoreService,
		private storeFacade: StoreFacade,
		private databaseService: DatabaseService
	) {}

	/**
	 * Database listeners on the Lore Document
	 *
	 * Automatically issue the load style effects straight start the database
	 */
	private initialLores$ = this.databaseService.database$.pipe(
		switchMap(db => db.lore.find().$.pipe(take(1))),
		map(lores => lores.map(lore => ({ name: lore.name, id: lore.id, planet: { radius: lore.planet.radius, name: lore.planet.name }, locations: lore.locations } as Lore))),
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


	@Effect()
	public updateSelectedLore$ = this.actions$.pipe(
		ofType(loadLoresSuccess.type),
		flatMap(({ payload }) => payload),
		take(1),
		map((lore) => changeSelectedLore({ payload: lore }))
	);
	/**
	 * Create
	 */
	@Effect()
	public createLore$ = this.actions$.pipe(
		ofType(createLore.type),
		distinctUntilChanged(),
		switchMap(({ payload }: Payload<Lore>) =>
			this.loreService.create(payload).pipe(
				map(a => voidOperation()), // The successful result will be handled by the listeners on the database
				catchError(error => of(createLoreFailure({ payload: error })))
			)
		)
	);

	@Effect()
	public changeCurrentLore$ = this.actions$.pipe(
		ofType(changeSelectedLore.type),
		withLatestFrom(this.storeFacade.lores$),
		map(
			([{ payload }, lores]) =>
				lores.find(lore => lore.name === payload.name) || new Error('No lores with this name')
		),
		map(lore => changeSelectedLoreSuccess({ payload: lore })),
		catchError(error => of(changeSelectedLoreFailure({ payload: error })))
	);


	@Effect()
	public changedCurrentLore$ = this.actions$.pipe(
		ofType(changeSelectedLoreSuccess.type),
		map(({ payload }) => loadActors({ payload: payload.id })),
	);


}

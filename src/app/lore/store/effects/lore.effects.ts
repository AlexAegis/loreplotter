import { Injectable } from '@angular/core';
import { Lore } from '@app/model/data';
import { DatabaseService } from '@app/service/database.service';
import { LoreService } from '@app/service/lore.service';
import { Payload } from '@lore/store/actions/payload.interface';
import { FeatureState } from '@lore/store/reducers';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concat, EMPTY, merge, of } from 'rxjs';
import { fromPromise } from 'rxjs/internal-compatibility';
import { catchError, delayWhen, flatMap, map, mergeMap, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';

import {
	changeSelectedLore,
	changeSelectedLoreFailure,
	changeSelectedLoreSuccess,
	createLore,
	createLoreFailure,
	createLoreSuccess, deleteActorDelta, deleteActorSuccess,
	deleteLore,
	deleteLoreFailure,
	deleteLoreSuccess,
	FeatureActions,
	loadActors,
	loadLoresFailure,
	loadLoresSuccess,
	updateLore,
	updateLoreFailure,
	updateLoreSuccess,
	voidOperation
} from '../actions';

/**
 * Lore effects
 *
 * Whenever an action happens, these effects are what executing the tasks that you 'assign' end them here
 */
@Injectable()
export class LoreEffects {
	public constructor(
		private actions$: Actions<FeatureActions>,
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
		map(lores =>
			lores.map(
				lore => ({
						name: lore.name,
						id: lore.id,
						planet: { radius: lore.planet.radius, name: lore.planet.name }
					} as Lore)
			)
		),
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
		map(lore => updateLoreSuccess({ payload: lore }))
	);

	private deletedLores$ = this.databaseService.database$.pipe(
		switchMap(db => db.lore.remove$),
		map(change => change.data.v),
		map(lore => deleteLoreSuccess({ payload: { id: (lore as Lore).id } }))
	);

	@Effect()
	public allLores$ = concat(this.initialLores$, merge(this.insertedLores$, this.updatedLores$, this.deletedLores$));

	@Effect()
	public updateInitialSelectedLore$ = this.actions$.pipe(
		ofType(loadLoresSuccess.type),
		flatMap(({ payload }) => payload),
		take(1),
		map(lore => changeSelectedLore({ payload: lore }))
	);

	@Effect()
	public updateSelectedLoreWhenCreated$ = this.actions$.pipe(
		ofType(createLoreSuccess.type),
		map((payload) => changeSelectedLore(payload))
	);

	/**
	 * Create
	 */
	@Effect()
	public createLore$ = this.actions$.pipe(
		ofType(createLore.type),
		switchMap((
			{ payload }: Payload<{ tex: Blob } & Lore> //
			) =>
			this.loreService.create(payload).pipe(
				delayWhen(lore => {
					if (payload.tex) {
						return fromPromise(
							lore.putAttachment({
								id: 'texture',
								data: payload.tex as Blob,
								type: 'image/jpeg'
							})
						);
					} else {
						return EMPTY;
					}
				}),
				map(a => voidOperation()), // The successful result will be handled by the listeners on the database
				catchError(error => of(createLoreFailure({ payload: error })))
			)
		)
	);
	//  Payload<{ ...Partial<Lore>>, number }
	@Effect()
	public updateLore$ = this.actions$.pipe(
		ofType(updateLore.type),
		switchMap(({ payload }: Payload<{ tex: Blob } & Partial<Lore>>) =>
			this.loreService.update(payload).pipe(
				delayWhen(lore => {
					if (payload.tex) {
						return fromPromise(
							lore.putAttachment({
								id: 'texture',
								data: payload.tex as Blob,
								type: 'image/jpeg'
							})
						).pipe(tap(e => console.log(e)));
					} else {
						return EMPTY;
					}
				}),
				map(a => voidOperation()), // The successful result will be handled by the listeners on the database
				catchError(error => of(updateLoreFailure({ payload: error })))
			)
		)
	);

	@Effect()
	public changeCurrentLore$ = this.actions$.pipe(
		ofType(changeSelectedLore.type),
		withLatestFrom(this.storeFacade.lores$),
		map(([{ payload }, lores]) => lores.find(lore => lore.id === payload.id) || new Error('No lores with this id')),
		map(lore => changeSelectedLoreSuccess({ payload: lore })),
		catchError(error => of(changeSelectedLoreFailure({ payload: error })))
	);

	@Effect()
	public changedCurrentLoreLoadActors$ = this.actions$.pipe(
		ofType(changeSelectedLoreSuccess.type),
		map(({ payload }) => loadActors({ payload: payload.id }))
	);

	@Effect()
	public deleteLore$ = this.actions$.pipe(
		ofType(deleteLore.type),
		mergeMap(({ payload }) =>
			this.loreService.delete(payload.id).pipe(
				take(1),
				map(result =>
					result
						? voidOperation()
						: deleteLoreFailure({ payload: new Error('Remove failed') })
				)
			)
		)
	);

	@Effect({ dispatch: false })
	public deleteLoreFailure$ = this.actions$.pipe(
		ofType(deleteLoreFailure.type),
		tap(error => console.log(error))
	);
}

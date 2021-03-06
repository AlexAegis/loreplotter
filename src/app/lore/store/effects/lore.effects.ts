import { Injectable } from '@angular/core';
import { Lore, Planet } from '@app/model/data';
import { DatabaseService } from '@app/service/database.service';
import { LoreService } from '@app/service/lore.service';
import { Payload } from '@lore/store/actions/payload.interface';
import { FeatureState } from '@lore/store/reducers';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { concat, EMPTY, from, merge, of } from 'rxjs';
import { catchError, delayWhen, flatMap, map, mergeMap, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';

import {
	changeSelectedLore,
	changeSelectedLoreFailure,
	changeSelectedLoreSuccess,
	createLore,
	createLoreFailure,
	createLoreSuccess,
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
		map(lores => lores.map(lore => new Lore(lore.id, lore.name, new Planet(lore.planet.name, lore.planet.radius)))),
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
		map(lore => deleteLoreSuccess({ payload: (lore as Lore).id }))
	);

	@Effect()
	public allLores$ = concat(this.initialLores$, merge(this.insertedLores$, this.updatedLores$, this.deletedLores$));

	@Effect()
	public updateSelectedLore$ = this.actions$.pipe(
		ofType(loadLoresSuccess.type),
		flatMap(({ payload }) => payload),
		take(1),
		map(lore => changeSelectedLore({ payload: lore.id }))
	);

	@Effect()
	public updateSelectedLoreWhenCreated$ = this.actions$.pipe(
		ofType(createLoreSuccess.type),
		map(({ payload }) => changeSelectedLore({ payload: payload.id }))
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
						return from(
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
						return from(
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

	/*



	 */

	/*
		@Effect({ dispatch: false })
		public attachTextureToLore$ = this.actions$.pipe(
			ofType(attachTexture.type),
			switchMap(({ payload }: Payload<{ texture: Blob; lore: RxDocument<Lore> }>) =>
				iif(
					() => payload.texture !== undefined,
					this.databaseService.lores$.pipe(
						take(1),
						flatMap(lores => lores),
						filter(loreDoc => loreDoc.id === payload.lore.id),
						switchMap(loreDoc =>
							loreDoc.putAttachment({
								id: 'texture',
								data: payload.texture,
								type: 'image/jpeg'
							})
						)
					),
					EMPTY
				)
			)
		);*/

	@Effect()
	public changeCurrentLore$ = this.actions$.pipe(
		ofType(changeSelectedLore.type),
		withLatestFrom(this.storeFacade.lores$),
		map(([{ payload }, lores]) => lores.find(lore => lore.id === payload) || new Error('No lores with this id')),
		map(lore => changeSelectedLoreSuccess({ payload: lore })),
		catchError(error => of(changeSelectedLoreFailure({ payload: error })))
	);

	@Effect()
	public changedCurrentLoreLoadActors$ = this.actions$.pipe(
		ofType(changeSelectedLoreSuccess.type),
		map(({ payload }) => loadActors({ payload: payload.id }))
	);

	/**
	 * Also makes sure that all the actors are deleted too.
	 */
	@Effect()
	public deleteLore$ = this.actions$.pipe(
		ofType(deleteLore.type),
		mergeMap(({ payload }: Payload<string>) =>
			this.loreService.delete(payload).pipe(
				take(1),
				map(result =>
					result
						? deleteLoreSuccess({ payload: payload })
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

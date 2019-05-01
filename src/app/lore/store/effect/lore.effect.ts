import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, concatMap, switchMap, catchError, tap } from 'rxjs/operators';

import {
	createLore,
	createLoreFailure,
	createLoreSuccess,
	loadLores,
	loadLoresFailure,
	loadLoresSuccess,
	LoreActions, Payload
} from '../actions';
import { LoreService } from '@app/service/lore.service';
import { DatabaseService } from '@app/service/database.service';
import { RxDocument } from 'rxdb';
import { LoreDocumentMethods } from '@app/service';
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
	 * Load lores
	 *
	 * Loads the lores from the database
	 */
	@Effect()
	loadLores$ = this.actions$.pipe(
		ofType(loadLores.type),
		tap(e => console.log('load lores!')),
		tap(e => console.log(e)),
		switchMap(() => {
			return this.databaseService.lores$.pipe(
				map(result => result.map(LoreEffect.loreStripper)),
				tap(e => console.log(e)),
				map(result => loadLoresSuccess({ lores: result })),
				catchError(error => of(loadLoresFailure({ error })))
			);
		})
	);

	/**
	 * Create
	 */
	@Effect()
	createLore$ = this.actions$.pipe(
		ofType(createLore.type),
		switchMap(({ payload }: Payload<Lore>) => {
			console.log('CreateLore effect is in action!');
			console.log(payload);
			return this.loreService.create(payload).pipe(
				tap(result => console.log('LORE CREATED')),
				tap(result => console.log(result)),
				map(LoreEffect.loreStripper),
				map(lore => createLoreSuccess(lore)),
				catchError(error => of(createLoreFailure({ error })))
			);
		}),
		tap(e => console.log('somethings fishy')),
		tap(e => console.log(e))
	);

	private static loreStripper(doc: RxDocument<Lore, LoreDocumentMethods>): Partial<Lore> {
		return { name: doc.name };
	}
/*
	private static loreStripper({ name, planet }: RxDocument<Lore, LoreDocumentMethods>): Partial<Lore> {
		return { name, planet };
	}*/
}

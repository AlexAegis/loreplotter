import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CoreModule } from '@app/core.module';
import { Lore, PLANET_DEFAULT_NAME, PLANET_DEFAULT_RADIUS } from '@app/model/data';
import { SharedModule } from '@app/shared';
import { AppStoreModule } from '@app/store/app-store.module';
import { metaReducers } from '@app/store/reducers';
import { LoreModule } from '@lore/lore.module';
import { createLore, loadLores } from '@lore/store/actions';
import { APP_LORE_FEATURE_STATE_ID, LoreStoreModule } from '@lore/store/lore-store.module';
import { AppState, initialActorState, initialLoreState, initialSceneState, reducers } from '@lore/store/reducers';
import { StoreFacade } from '@lore/store/store-facade.service';
import { async, TestBed } from '@angular/core/testing';
import { StoreModule, Store } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { provideMockStore } from '@ngrx/store/testing';

describe('StoreFacade', () => {
	let store: Store<AppState>;
	let facade: StoreFacade;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientTestingModule,
				StoreModule.forRoot({}),
				LoreModule
			],
			 providers: [
			 	provideMockStore<AppState>({
					initialState: { app: { lores: initialLoreState, actor: initialActorState, scene: initialSceneState}, router: {} as any }
				})
			 ]
		});

		store = TestBed.get(Store);
		// spyOn(store, 'dispatch').and.callThrough();
		// spyOn(store, 'pipe').and.callThrough();
		// facade = TestBed.get(StoreFacade);
	}));

	it('should call CreateTodo', () => {
		const lore: { tex: Blob } & Lore = {
			id: '1',
			name: 'test',
			planet: { name: PLANET_DEFAULT_NAME, radius: PLANET_DEFAULT_RADIUS },
			tex: undefined
		};
		// facade.createLore(lore);
		// const action = createLore({ payload: lore });
		// expect(store.dispatch).toHaveBeenCalledWith(action);
	});

	/*
	it('should call UpdateTodo', () => {
		const todo = new Todo('1', 'test');
		facade.update(todo);
		const action = updateTodo({
			todo: {
				id: todo.id,
				changes: todo
			}
		});
		expect(store.dispatch).toHaveBeenCalledWith(action);
	});

	it('should call DeleteTodo', () => {
		const id = '1';
		facade.delete(id);
		const action = deleteTodo({ id });
		expect(store.dispatch).toHaveBeenCalledWith(action);
	});*/
});

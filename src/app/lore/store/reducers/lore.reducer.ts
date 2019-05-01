import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

import { Actor, Lore } from '@app/model/data';
import {
	LoreActions,
	loadLores,
	createLore,
	createLoreSuccess,
	createLoreFailure,
	loadLoresSuccess,
	loadLoresFailure, updateLore, deleteLoreSuccess, deleteLore, updateLoreFailure, updateLoreSuccess, deleteLoreFailure
} from '../actions';
import { RxDocument } from 'rxdb';

/**
 * State ID
 */
export const STATE_ID = 'lore';

/**
 * State
 */
export interface State extends EntityState<Partial<Lore>> {
	loading: boolean;
}

// const initialState: Partial<State> = { loading: false };
/**
 * Adapter
 */
export const loreAdapter: EntityAdapter<Partial<Lore>> = createEntityAdapter<Partial<Lore>>({
	selectId: lore => lore.name
});
export const actorAdapter: EntityAdapter<Partial<Actor>> = createEntityAdapter<Partial<Actor>>({
	selectId: actor => actor.id
});

/**
 * Initial state
 */
export const initialState: State = loreAdapter.getInitialState({
	loading: false
});

/**
 * Reducer
 *
 * This is what keeps the application state updated whenever an action happens
 *
 * @param state State
 * @param action Action
 */
export function reducer(state: State = initialState, action: LoreActions): State {
	console.log('Reducer in action!');
	console.log(state);
	console.log(action);
	switch (action.type) {
		// initial load
		case loadLores.type: {
			return { ...state, loading: true };
		}
		case loadLoresSuccess.type: {
			const { lores } = action.payload;
			return loreAdapter.addAll(lores, { ...state, loading: false });
		}
		case loadLoresFailure.type: {
			return { ...state, loading: false };
		}
		// create
		case createLore.type: {

			return { ...state, loading: true };
		}
		case createLoreSuccess.type: {
			return loreAdapter.addOne(action, { ...state, loading: false });
		}
		case createLoreFailure.type: {
			return { ...state, loading: false };
		}
		// update
		case updateLore.type: {
			return { ...state, loading: true };
		}
		case updateLoreSuccess.type: {
			const { todo } = action.payload;
			return loreAdapter.updateOne(todo, { ...state, loading: false });
		}
		case updateLoreFailure.type: {
			return { ...state, loading: false };
		}
		// delete
		case deleteLore.type: {
			return { ...state, loading: true };
		}
		case deleteLoreSuccess.type: {
			const { id } = action.payload;
			return loreAdapter.removeOne(id, { ...state, loading: false });
		}
		case deleteLoreFailure.type: {
			return { ...state, loading: false };
		}
		default: {
			return state;
		}
	}
}

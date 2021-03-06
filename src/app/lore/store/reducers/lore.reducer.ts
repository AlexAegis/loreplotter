import { Lore } from '@app/model/data';
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
	loadLores,
	loadLoresFailure,
	loadLoresSuccess,
	LoreActions,
	updateLore,
	updateLoreFailure,
	updateLoreSuccess
} from '@lore/store/actions';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

/**
 * LoreState
 */
export interface LoreState extends EntityState<Partial<Lore>> {
	loading: boolean;
	selected: string;
}

// const initialLoreState: Partial<LoreState> = { loading: false };
/**
 * Adapter
 */
export const loreAdapter: EntityAdapter<Partial<Lore>> = createEntityAdapter<Partial<Lore>>({
	selectId: lore => lore.id
});

/**
 * Initial state
 */
export const initialLoreState: LoreState = loreAdapter.getInitialState({
	loading: false,
	selected: undefined
});

/**
 * Reducer
 *
 * This is what keeps the application state updated whenever an action happens
 *
 * @param state LoreState
 * @param action Action
 */
export function loreReducer(state: LoreState = initialLoreState, action: LoreActions): LoreState {
	switch (action.type) {
		// initial load
		case loadLores.type: {
			return { ...state, loading: true };
		}
		case loadLoresSuccess.type: {
			const { payload } = action;
			return loreAdapter.addAll(payload, { ...state, loading: false });
		}
		case loadLoresFailure.type: {
			return { ...state, loading: false };
		}
		// create
		case createLore.type: {
			return { ...state, loading: true };
		}
		case createLoreSuccess.type: {
			const { payload } = action;
			return loreAdapter.addOne(payload, { ...state, loading: false });
		}
		case createLoreFailure.type: {
			return { ...state, loading: false };
		}
		// update
		case updateLore.type: {
			return { ...state, loading: true };
		}
		case updateLoreSuccess.type: {
			const { payload } = action.payload;
			return loreAdapter.updateOne({ id: payload.id, changes: payload }, { ...state, loading: false });
		}
		case updateLoreFailure.type: {
			return { ...state, loading: false };
		}
		// delete
		case deleteLore.type: {
			return { ...state, loading: true };
		}
		case deleteLoreSuccess.type: {
			return loreAdapter.removeOne(action.payload, { ...state, loading: false });
		}
		case deleteLoreFailure.type: {
			return { ...state, loading: false };
		}
		// Change selected lore
		case changeSelectedLore.type: {
			return { ...state, loading: true };
		}
		case changeSelectedLoreSuccess.type: {
			const { payload } = action;
			return { ...state, loading: false, selected: payload.id };
		}
		case changeSelectedLoreFailure.type: {
			return { ...state, loading: false };
		}
		default: {
			return state;
		}
	}
}

import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

import { Lore } from '@app/model/data';
import { LoreActions, loadLores } from '../actions';

/**
 * State ID
 */
export const STATE_ID = 'lore';

/**
 * State
 */
export interface State extends EntityState<Lore> {
	loading: boolean;
}

/**
 * Adapter
 */
export const adapter: EntityAdapter<Lore> = createEntityAdapter<Lore>();

/**
 * Initial state
 */
export const initialState: State = adapter.getInitialState({
	loading: false
});

/**
 * Reducer
 * @param state State
 * @param action Action
 */
export function reducer(state = initialState, action: LoreActions): State {
	switch (action.type) {
		case loadLores.type: {
			return { ...state, loading: true };
		}
		default: {
			return state;
		}
	}
}

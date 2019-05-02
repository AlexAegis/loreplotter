import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';

import { Actor, Lore } from '@app/model/data';
import {
	LoreActions,
	loadLores,
	createLore,
	createLoreSuccess,
	createLoreFailure,
	loadLoresSuccess,
	loadLoresFailure,
	updateLore,
	deleteLoreSuccess,
	deleteLore,
	updateLoreFailure,
	updateLoreSuccess,
	deleteLoreFailure,
	changeSelectedLore,
	changeSelectedLoreSuccess, changeSelectedLoreFailure, SceneActions
} from '../actions';
import { ActionReducerMap, combineReducers, compose } from '@ngrx/store';
import { setPlaySpeed, setPlaySpeedFailure, setPlaySpeedSuccess } from '@lore/store/actions/scene.actions';
import { State } from '@app/store/reducers';

/**
 * Extending the root state with the lazy-feature module's own root-level entry
 */
export interface AppState extends State {
	'app-lore': FeatureState;
}

export interface FeatureState {
	lores: LoreState;
	scene: SceneState;
}

/**
 * LoreState
 */
export interface LoreState extends EntityState<Partial<Lore>> {
	loading: boolean;
	selected: Partial<Lore>;
}

export interface SceneState {
	loading: boolean;
	playSpeed: number;
}

// const initialLoreState: Partial<LoreState> = { loading: false };
/**
 * Adapter
 */
export const loreAdapter: EntityAdapter<Partial<Lore>> = createEntityAdapter<Partial<Lore>>({
	selectId: lore => lore.name
});

/**
 * Initial state
 */
export const initialLoreState: LoreState = loreAdapter.getInitialState({
	loading: false,
	selected: { name: 'Example' }
});

export const initialSceneState: SceneState = {
	loading: false,
	playSpeed: 0
};

export const initialState: FeatureState = {
	lores: initialLoreState,
	scene: initialSceneState
};

/**
 * Reducer
 *
 * This is what keeps the application state updated whenever an action happens
 *
 * @param state LoreState
 * @param action Action
 */
export function appLoreReducer(state: LoreState = initialLoreState, action: LoreActions): LoreState {
	console.log('Lore Reducer in action!');
	console.log(state);
	console.log(action);
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
			return loreAdapter.updateOne(payload, { ...state, loading: false });
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
		// Change selected lore
		case changeSelectedLore.type: {
			return { ...state, loading: true  };
		}
		case changeSelectedLoreSuccess.type: {
			const { payload } = action;
			return { ...state, loading: false , selected: payload };
		}
		case changeSelectedLoreFailure.type: {
			return { ...state, loading: false };
		}
		default: {
			return state;
		}
	}
}

export function sceneReducer(state: SceneState = initialSceneState, action: SceneActions): SceneState {
	console.log('SceneReducer in action!');
	console.log(state);
	console.log(action);
	switch (action.type) {
		case setPlaySpeed.type: {
			return { ...state, loading: true };
		}
		case setPlaySpeedSuccess.type: {
			const { payload } = action;
			return { ...state, playSpeed: payload, loading: false };
		}
		case setPlaySpeedFailure.type: {
			return { ...state, loading: false };
		}
		default: {
			return state;
		}
	}
}

export const reducers: ActionReducerMap<FeatureState> = {
	lores: appLoreReducer,
	scene: sceneReducer
};

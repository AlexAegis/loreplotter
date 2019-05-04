import { environment } from '@env/environment';
import { APP_LORE_FEATURE_STATE_ID } from '@lore/store';
import * as fromRouter from '@ngrx/router-store';
import { ActionReducer, ActionReducerMap, MetaReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { localStorageSync } from 'ngrx-store-localstorage';

/**
 * Root state
 */
export interface State {
	router: fromRouter.RouterReducerState;
}

/**
 * Root reducers
 */
export const reducers: ActionReducerMap<State> = {
	router: fromRouter.routerReducer
};

/**
 * Logger
 * @param reducer Reducer
 */
export function logger(reducer: ActionReducer<State>): ActionReducer<State> {
	return (state: State, action: any): any => {
		const result = reducer(state, action);
		/* console.groupCollapsed(action.type);
		console.log('prev state', state);
		console.log('action', action);
		console.log('next state', result);
		console.groupEnd();*/
		return result;
	};
}

const persistant = {
	APP_LORE_FEATURE_STATE_ID: {
		lores: [],

	}
}

export function localStorageSyncReducer(reducer: ActionReducer<State>): ActionReducer<State> {
	return localStorageSync({keys: [APP_LORE_FEATURE_STATE_ID], rehydrate: true })(reducer);
}
/**
 * Meta reducers
 */
export const metaReducers: MetaReducer<State>[] = [localStorageSyncReducer, ...(!environment.production ? [logger, storeFreeze] : [])];

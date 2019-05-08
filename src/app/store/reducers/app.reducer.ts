import { environment } from '@env/environment';
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
		// console.groupCollapsed(action.type);
		// console.log('prev state', state);
		// console.log('action', action);
		// console.log('next state', result);
		// console.groupEnd();
		return result;
	};
}

const persistent = [
	{
		'app-lore': ['scene']
	}
];

export function localStorageSyncReducer(reducer: ActionReducer<State>): ActionReducer<State> {
	return localStorageSync({ keys: persistent, rehydrate: true })(reducer);
}
/**
 * Meta reducers
 */
export const metaReducers: MetaReducer<State>[] = [
	localStorageSyncReducer,
	...(!environment.production ? [/*logger, */ storeFreeze] : [])
];

import { createFeatureSelector, createSelector, } from '@ngrx/store';

import { State, STATE_ID } from '../reducers';
import { loreAdapter } from '@lore/store/reducers';

/**
 * Selectors
 */
const { selectAll } = loreAdapter.getSelectors();
const getLoreState = createFeatureSelector<State>(STATE_ID);
const getLoading = createSelector(
	getLoreState,
	state => state.loading
);
const getLores = createSelector(
	getLoreState,
	selectAll
);

/**
 * Queries
 */
export const loreQuery = {
	getLoading,
	getLores
};

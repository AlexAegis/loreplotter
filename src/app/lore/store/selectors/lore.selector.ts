import { createFeatureSelector, createSelector, } from '@ngrx/store';
import { State, STATE_ID, loreAdapter } from '@lore/store/reducers';

/**
 * Selectors
 */
const { selectAll } = loreAdapter.getSelectors();

const getLoreState = createFeatureSelector<State>(STATE_ID);

const getLores = createSelector(
	getLoreState,
	selectAll
);
const getLoading = createSelector(
	getLoreState,
	state => state.loading
);
const getSelected = createSelector(
	getLoreState,
	state => state.selected
);

/**
 * Queries
 */
export const loreQuery = {
	getLoading,
	getLores,
	getSelected,
};

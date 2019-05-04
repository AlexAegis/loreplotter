import { createSelector } from '@ngrx/store';
import { loreAdapter } from '@lore/store/reducers';
import { getFeatureState } from '@lore/store/selectors/app-lore.selectors';


/**
 * Selectors
 */
const { selectAll } = loreAdapter.getSelectors();


const getLoreState = createSelector(
	getFeatureState,
	(state) => state.lores
);

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
	getSelected
};

import { createSelector } from '@ngrx/store';
import { actorAdapter } from '@lore/store/reducers';
import { getFeatureState } from '@lore/store/selectors/app-lore.selectors';


/**
 * Selectors
 */
const { selectAll } = actorAdapter.getSelectors();


const getActorState = createSelector(
	getFeatureState,
	(state) => state.actor
);

const getActors = createSelector(
	getActorState,
	selectAll
);
const getLoading = createSelector(
	getActorState,
	state => state.loading
);
const getSelected = createSelector(
	getActorState,
	state => state.selected
);

/**
 * Queries
 */
export const actorQuery = {
	getLoading,
	getActors,
	getSelected
};

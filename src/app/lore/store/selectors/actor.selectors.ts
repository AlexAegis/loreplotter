import { Actor } from '@app/model/data';
import { actorAdapter } from '@lore/store/reducers';
import { getFeatureState } from '@lore/store/selectors/app-lore.selectors';
import { Dictionary } from '@ngrx/entity';
import { createSelector } from '@ngrx/store';

/**
 * Selectors
 */
const { selectAll, selectEntities } = actorAdapter.getSelectors();

const getActorState = createSelector(
	getFeatureState,
	state => state.actor
);

const getActors = createSelector(
	getActorState,
	selectAll
);

const getActorEntities = createSelector(
	getActorState,
	selectEntities
);

const getLoading = createSelector(
	getActorState,
	state => state.loading
);
const getSelected = createSelector(
	getActorState,
	state => state.selected
);

const getActorEntityById = createSelector(
	getActorEntities,
	(entities: Dictionary<Actor>, props: { id: string }) => {
		return entities[props.id];
	}
);

/**
 * Queries
 */
export const actorQuery = {
	getLoading,
	getActors,
	getActorEntities,
	getActorEntityById,
	getSelected
};

import { ActorDelta } from '@app/model/data';
import { actorAdapter } from '@lore/store/reducers';
import { actorDeltaAdapter } from '@lore/store/reducers/actor-delta.reducer';
import { getFeatureState } from '@lore/store/selectors/app-lore.selectors';
import { Dictionary } from '@ngrx/entity';
import { createSelector } from '@ngrx/store';

/**
 * Selectors
 */

/*
const { selectAll, selectEntities } = actorDeltaAdapter.getSelectors();

const getActorState = createSelector(
	getFeatureState,
	state => state.actor
);

const getActors = createSelector(
	getActorState,
	selectAll
);

const getActorDeltaEntities = createSelector(
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

const getActorDeltaEntityById = createSelector(
	getActorDeltaEntities,
	(entities: Dictionary<ActorDelta>, props: { id: string }) => {
		return entities[props.id];
	}
);

const getAccumulated = createSelector(
	getFeatureState,
	state => state.scene.c
);*/


/**
 * Queries
 */
export const actorDeltaQuery = {/*
	getAccumulated,
	getLoading,
	getActors,
	getActorDeltaEntities,
	getActorDeltaEntityById,
	getSelected*/
};

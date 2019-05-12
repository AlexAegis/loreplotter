import { ActorDelta } from '@app/model/data';
import { actorAdapter, ActorEntity, AppState } from '@lore/store/reducers';
import { actorDeltaAdapter, ActorDeltaEntity } from '@lore/store/reducers/actor-delta.reducer';
import { actorQuery } from '@lore/store/selectors/actor.selectors';
import { getFeatureState } from '@lore/store/selectors/app-lore.selectors';
import { Dictionary } from '@ngrx/entity';
import { createSelector, defaultMemoize, resultMemoize } from '@ngrx/store';

/**
 * Selectors
 */


const { selectAll, selectEntities, selectTotal} = actorDeltaAdapter.getSelectors();



const getDeltas = createSelector(
	actorQuery.getActorEntityById,
	(actorEntity) => actorEntity.deltas
);


const getAllDeltas = createSelector(
	getDeltas,
	selectAll
);


const getDeltaUnix = (actorId: string) => createSelector(
	(state, props) => actorQuery.getActorEntityById(state, { id: actorId }),
	(state) => (deltaId: string) => {
		return state.deltas.entities[deltaId];
	}
);

/*
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
export const actorDeltaQuery = {
	getDeltas,
	getAllDeltas,
	getDeltaUnix,/*
	getAccumulated,
	getLoading,
	getActors,
	getActorDeltaEntities,
	getActorDeltaEntityById,
	getSelected*/
	raw: {
		selectAll,
		selectTotal,
		selectEntities
	}
};

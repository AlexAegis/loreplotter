import { OverridableProperty } from '@app/model';
import { Actor, ActorDelta } from '@app/model/data';
import {
	ActorActions,
	ActorDeltaActions,
	changeSelectedActor,
	changeSelectedActorFailure,
	changeSelectedActorSuccess,
	createActor, createActorDelta, createActorDeltaFailure, createActorDeltaSuccess,
	createActorFailure,
	createActorSuccess,
	deleteActor, deleteActorDelta, deleteActorDeltaFailure, deleteActorDeltaSuccess,
	deleteActorFailure,
	deleteActorSuccess, loadActorDeltasForActor, loadActorDeltasForActorFailure,
	loadActorDeltasForActorSuccess,
	loadActors,
	loadActorsFailure,
	loadActorsSuccess,
	updateActor, updateActorDelta, updateActorDeltaFailure, updateActorDeltaSuccess,
	updateActorFailure,
	updateActorSuccess
} from '@lore/store/actions';
import { actorAdapter } from '@lore/store/reducers/actor.reducer';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';


export interface ActorDeltaEntity extends ActorDelta {
	unixOverride: number;
}

export interface ActorDeltaState extends EntityState<Partial<ActorDeltaEntity>> {
	loading: boolean;
	selected: string;
}

/**
 * Adapter
 */
export const actorDeltaAdapter: EntityAdapter<Partial<ActorDeltaEntity>> = createEntityAdapter<Partial<ActorDeltaEntity>>({
	selectId: a => a.id,
	sortComparer: (a, b) => (a.unixOverride || a.unix) - (b.unixOverride || b.unix)
});

/**
 * Initial state
 */
export const makeInitialActorDeltaState = (parent: string) =>
	actorDeltaAdapter.getInitialState({
		parent, // ActorID, only for checks
		loading: false,
		selected: undefined
	});

/**
 * Reducer
 *
 * @param state ActorDeltaState
 * @param action Action
 */
export function actorDeltaReducer(state: ActorDeltaState, action: ActorDeltaActions): ActorDeltaState {
	switch (action.type) {
		// Initial Load
		case loadActorDeltasForActor.type: {
			return { ...state, loading: true };
		}
		case loadActorDeltasForActorSuccess.type: {
			return actorDeltaAdapter.addAll(action.payload.deltas, { ...state, loading: false});
		}
		case loadActorDeltasForActorFailure.type: {
			return { ...state, loading: false };
		}
		// create
		case createActorDelta.type: {
			return { ...state, loading: true };
		}
		case createActorDeltaSuccess.type: {
			const { payload } = action;
			return actorDeltaAdapter.addOne(payload.delta, { ...state, loading: false });
		}
		case createActorDeltaFailure.type: {
			return { ...state, loading: false };
		}
		// update
		case updateActorDelta.type: {
			return { ...state, loading: true };
		}
		case updateActorDeltaSuccess.type: {
			const { payload } = action;
			return actorDeltaAdapter.updateOne({ id: payload.delta.id, changes: payload.delta }, { ...state, loading: false });
		}
		case updateActorDeltaFailure.type: {
			return { ...state, loading: false };
		}
		// delete
		case deleteActorDelta.type: {
			return { ...state, loading: true };
		}
		case deleteActorDeltaSuccess.type: {
			const { payload } = action;
			return actorDeltaAdapter.removeOne(payload.id, { ...state, loading: false });
		}
		case deleteActorDeltaFailure.type: {
			return { ...state, loading: false };
		}
		// Change selected lore
	/*	case changeSelectedActorDelta.type: {
			return { ...state, loading: true };
		}
		case changeSelectedActorSDeltauccess.type: {
			const { payload } = action;
			return { ...state, loading: false, selected: payload.id };
		}
		case changeSelectedActorDeltaFailure.type: {
			return { ...state, loading: false };
		}*/

		default: {
			return state;
		}
	}
}

import { Actor, ActorDelta } from '@app/model/data';
import {
	ActorActions,
	ActorDeltaActions, bakeActorDeltaUnixOverride,
	changeSelectedActor,
	changeSelectedActorFailure,
	changeSelectedActorSuccess,
	createActor,
	createActorFailure,
	createActorSuccess,
	deleteActor,
	deleteActorFailure,
	deleteActorSuccess, loadActorDeltasForActor, loadActorDeltasForActorFailure,
	loadActorDeltasForActorSuccess,
	loadActors,
	loadActorsFailure,
	loadActorsSuccess, setActorDeltaUnix, setActorDeltaUnixOverride,
	updateActor,
	updateActorFailure,
	updateActorSuccess
} from '@lore/store/actions';
import { actorDeltaReducer, ActorDeltaState } from '@lore/store/reducers/actor-delta.reducer';
import { actorDeltaQuery } from '@lore/store/selectors';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

/**
 * Same as in the database but the deltas are loaded and sorted, the reducers should keep it sorted
 */
export interface ActorEntity extends Actor {
	deltas: ActorDeltaState;
}

export interface ActorState extends EntityState<Partial<ActorEntity>> {
	loading: boolean;
	selected: string;
}

/**
 * Adapter
 */
export const actorAdapter: EntityAdapter<Partial<ActorEntity>> = createEntityAdapter<Partial<ActorEntity>>({
	selectId: actor => actor.id
});

/**
 * Initial state
 */
export const initialActorState: ActorState = actorAdapter.getInitialState({
	loading: false,
	selected: undefined
});

/**
 * Reducer
 *
 * @param state ActorState
 * @param action Action
 */
export function actorReducer(
	state: ActorState = initialActorState,
	action: ActorActions | ActorDeltaActions
): ActorState {
	console.log(action.type);
	switch (action.type) {
		case loadActors.type: {
			return { ...state, loading: true };
		}
		case loadActorsSuccess.type: {
			actorAdapter.removeAll(state);
			return actorAdapter.addAll(action.payload, { ...state, loading: false });
		}
		case loadActorsFailure.type: {
			return { ...state, loading: false };
		}
		// create
		case createActor.type: {
			return { ...state, loading: true };
		}
		case createActorSuccess.type: {
			const { payload } = action;
			return actorAdapter.addOne(payload, { ...state, loading: false });
		}
		case createActorFailure.type: {
			return { ...state, loading: false };
		}
		// update
		case updateActor.type: {
			return { ...state, loading: true };
		}
		case updateActorSuccess.type: {
			const payload = action.payload;
			return actorAdapter.updateOne({ id: payload.id, changes: payload }, { ...state, loading: false });
		}
		case updateActorFailure.type: {
			return { ...state, loading: false };
		}
		// delete
		case deleteActor.type: {
			return { ...state, loading: true };
		}
		case deleteActorSuccess.type: {
			return actorAdapter.removeOne(action.payload.id, { ...state, loading: false });
		}
		case deleteActorFailure.type: {
			return { ...state, loading: false };
		}
		// Change selected lore
		case changeSelectedActor.type: {
			return { ...state, loading: true };
		}
		case changeSelectedActorSuccess.type: {
			const { payload } = action;
			return { ...state, loading: false, selected: payload.id };
		}
		case changeSelectedActorFailure.type: {
			return { ...state, loading: false };
		}
		// Propagation of sub-entities
		/*case loadActorDeltasForActor.type: {
			return actorAdapter.updateOne(
				{
					id: action.payload.id,
					changes: { deltas: actorDeltaReducer(state.entities[action.payload.id].deltas, action) }
				},
				{ ...state }
			);
		}*/
		case loadActorDeltasForActorSuccess.type: {
			return actorAdapter.updateOne(
				{
					id: action.payload.forActor.id,
					changes: { deltas: actorDeltaReducer(state.entities[action.payload.forActor.id].deltas, action) }
				},
				{ ...state }
			);
		}
		case setActorDeltaUnix.type:
		case setActorDeltaUnixOverride.type:
		case bakeActorDeltaUnixOverride.type: {

			const up = {
				id: action.payload.delta.actorId,
				changes: { deltas: actorDeltaReducer(state.entities[action.payload.delta.actorId].deltas, action) }
			};
			console.log(up);
			return actorAdapter.updateOne(
				up,
				{ ...state }
			);
		}
		default: {
			return state;
		}
	}
}

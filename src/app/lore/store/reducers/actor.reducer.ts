import { Actor } from '@app/model/data';
import { ActorActions, loadActors, loadActorsFailure, loadActorsSuccess } from '@lore/store/actions';
import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';

export interface BlockState {
	leftMost: number;
	rightMost: number;
}

export interface ActorState extends EntityState<Partial<Actor>> {
	loading: boolean;
	selected: string;
	block: BlockState;
}

/**
 * Adapter
 */
export const actorAdapter: EntityAdapter<Partial<Actor>> = createEntityAdapter<Partial<Actor>>({
	selectId: actor => actor.id
});

/**
 * Initial state
 */
export const initialActorState: ActorState = actorAdapter.getInitialState({
	loading: false,
	selected: undefined,
	block: {
		leftMost: undefined,
		rightMost: undefined
	}
});

/**
 * Reducer
 *
 * @param state ActorState
 * @param action Action
 */
export function actorReducer(state: ActorState = initialActorState, action: ActorActions): ActorState {
	switch (action.type) {
		case loadActors.type: {
			return { ...state, loading: true };
		}
		case loadActorsSuccess.type: {
			return actorAdapter.addAll(action.payload, { ...state, loading: false });
		}
		case loadActorsFailure.type: {
			return { ...state, loading: false };
		}
		default: {
			return state;
		}
	}
}

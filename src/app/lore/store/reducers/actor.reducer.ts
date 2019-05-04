import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Actor } from '@app/model/data';
import {
	ActorActions, loadActors,
	loadLores,
	loadLoresFailure,
	loadLoresSuccess,
	LoreActions, updateLore, updateLoreFailure, updateLoreSuccess
} from '@lore/store/actions';

export interface BlockState {
	leftMost: number;
	rightMost: number;
}

export interface ActorState extends EntityState<Partial<Actor>> {
	loading: boolean;
	selected: Partial<Actor>;
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

		default: {
			return state;
		}
	}
}

import { Actor } from '@app/model/data';
import { ActorFormResultData } from '@lore/component';
import { Payload } from '@lore/store/actions';
import { Update } from '@ngrx/entity';
import { createAction } from '@ngrx/store';

export const loadActors = createAction(`[Actor] Load`, (payload: Payload<string>): Payload<string> => payload);

export const loadActorsSuccess = createAction(
	`[Actor] Load Success`,
	(payload: Payload<Array<Actor>>): Payload<Array<Actor>> => payload
);
export const loadActorsFailure = createAction(`[Actor] Load Failure`, (payload: Payload<Error>) => ({ payload }));

export const createActor = createAction(
	`[Actor] Create`,
	({ actor }: { actor: Actor }): Payload<Actor> => {
		return { payload: actor };
	}
);

export const createActorSuccess = createAction(
	`[Actor] Create Success`,
	(payload: Payload<Partial<Actor>>): Payload<Partial<Actor>> => payload
);
export const createActorFailure = createAction(`[Actor] Create Failure`, (payload: Payload<Error>) => ({ payload }));

// Updating existing objectsk
export const updateActor = createAction(
	`[Actor] Update`,
	(payload: Payload<ActorFormResultData>): Payload<ActorFormResultData> => payload
);

export const updateActorSuccess = createAction(`[Actor] Update Success`, (payload: Payload<Update<Actor>>) => ({
	payload
}));
export const updateActorFailure = createAction(`[Actor] Update Failure`, (payload: Payload<Error>) => ({ payload }));

// Deleting existing objects
export const deleteActor = createAction(`[Actor] Delete`, (payload = {}) => ({ payload }));

export const deleteActorSuccess = createAction(`[Actor] Delete Success`, (payload = {}) => ({ payload }));
export const deleteActorFailure = createAction(`[Actor] Delete Failure`, (payload: Payload<Error>) => ({ payload }));

export const changeSelectedActor = createAction(
	`[Actor] Change Selected`,
	(payload: Payload<Partial<Actor>>): Payload<Partial<Actor>> => payload
);

export const moveNode = createAction(
	`[Block] Move Node`,
	(
		payload: Payload<{ original: number; from: number; to: number }>
	): Payload<{ original: number; from: number; to: number }> => payload
);

export const moveNodeFinal = createAction(
	`[Block] Move Node Final`,
	(
		payload: Payload<{ original: number; from: number; to: number }>
	): Payload<{ original: number; from: number; to: number }> => payload
);

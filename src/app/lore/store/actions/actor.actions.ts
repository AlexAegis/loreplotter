import { ActorFormResultData } from '@lore/component';
import { Payload } from '@lore/store/actions';
import { ActorEntity } from '@lore/store/reducers';
import { createAction } from '@ngrx/store';

export const loadActors = createAction(`[Actor] Load`, (payload: Payload<string>): Payload<string> => payload);

export const loadActorsSuccess = createAction(
	`[Actor] Load Success`,
	(payload: Payload<Array<ActorEntity>>): Payload<Array<ActorEntity>> => payload
);
export const loadActorsFailure = createAction(`[Actor] Load Failure`, (payload: Payload<Error>) => payload);

export const createActor = createAction(
	`[Actor] Create`,
	(payload: Payload<ActorEntity>): Payload<ActorEntity> => payload
);

export const createActorSuccess = createAction(
	`[Actor] Create Success`,
	(payload: Payload<Partial<ActorEntity>>): Payload<Partial<ActorEntity>> => payload
);
export const createActorFailure = createAction(`[Actor] Create Failure`, (payload: Payload<Error>) => payload);

// Updating existing objects
export const updateActor = createAction(
	`[Actor] Update`,
	(payload: Payload<ActorFormResultData>): Payload<ActorFormResultData> => payload
);

export const updateActorSuccess = createAction(
	`[Actor] Update Success`,
	(payload: Payload<Partial<ActorEntity>>) => payload
);
export const updateActorFailure = createAction(`[Actor] Update Failure`, (payload: Payload<Error>) => payload);

// Deleting existing objects
export const deleteActor = createAction(`[Actor] Delete`, (payload: Payload<Partial<ActorEntity>>) => payload);

export const deleteActorSuccess = createAction(`[Actor] Delete Success`, (payload: Payload<Partial<ActorEntity>>) => payload);
export const deleteActorFailure = createAction(`[Actor] Delete Failure`, (payload: Payload<Error>) => payload);

export const changeSelectedActor = createAction(
	`[Actor] Change Selected`,
	(payload: Payload<Partial<ActorEntity>>) => payload
);

export const changeSelectedActorSuccess = createAction(
	`[Actor] Change Selected Success`,
	(payload: Payload<Partial<ActorEntity>>) => payload
);

export const changeSelectedActorFailure = createAction(
	`[Actor] Change Selected Failure`,
	(payload: Payload<Partial<ActorEntity>>) => payload
);

export const moveNode = createAction(
	`[Block] Move Node`,
	(
		payload: Payload<{ original: number; from: number; to: number }>
	) => payload
);

export const moveNodeFinal = createAction(
	`[Block] Move Node Final`,
	(
		payload: Payload<{ original: number; from: number; to: number }>
	) => payload
);

import { Actor, ActorDelta } from '@app/model/data';
import { ActorFormResultData } from '@lore/component';
import { Payload } from '@lore/store/actions';
import { createAction } from '@ngrx/store';

export interface ForActorDelta {
	forActor: Partial<Actor>;
	delta: Partial<ActorDelta>;
}
export interface ForActorDeltas {
	forActor: Partial<Actor>;
	deltas: Array<Partial<ActorDelta>>;
}

export interface ForActorDeltaError {
	forActor: Partial<Actor>;
	forActorDelta: Partial<ActorDelta>;
	error: Error;
}

export const loadActorDeltasForActor = createAction(`[ActorDelta] Load`, (payload: Payload<Actor>) => payload);

export const loadActorDeltasForActorSuccess = createAction(
	`[ActorDelta] Load Success`,
	(payload: Payload<ForActorDeltas>) => payload
);
export const loadActorDeltasForActorFailure = createAction(
	`[ActorDelta] Load Failure`,
	(payload: Payload<ForActorDeltaError>) => payload
);

export const createActorDelta = createAction(`[ActorDelta] Create`, (payload: Payload<ForActorDelta>) => payload);

export const createActorDeltaSuccess = createAction(
	`[ActorDelta] Create Success`,
	(payload: Payload<Partial<ForActorDelta>>) => payload
);
export const createActorDeltaFailure = createAction(
	`[ActorDelta] Create Failure`,
	(payload: Payload<ForActorDeltaError>) => payload
);

// Updating existing objects
export const updateActorDelta = createAction(
	`[ActorDelta] Update`,
	(payload: Payload<ActorFormResultData>): Payload<ActorFormResultData> => payload
);

export const updateActorDeltaSuccess = createAction(
	`[ActorDelta] Update Success`,
	(payload: Payload<Partial<ForActorDelta>>) => payload
);
export const updateActorDeltaFailure = createAction(
	`[ActorDelta] Update Failure`,
	(payload: Payload<ForActorDeltaError>) => payload
);

// Deleting existing objects
export const deleteActorDelta = createAction(
	`[ActorDelta] Delete`,
	(payload: Payload<Partial<ForActorDelta>>) => payload
);

export const deleteActorDeltaSuccess = createAction(
	`[ActorDelta] Delete Success`,
	(payload: Payload<Partial<ActorDelta>>) => payload
);
export const deleteActorDeltaFailure = createAction(
	`[ActorDelta] Delete Failure`,
	(payload: Payload<ForActorDeltaError>) => payload
);

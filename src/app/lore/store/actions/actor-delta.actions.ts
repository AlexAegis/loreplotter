import { Actor, ActorDelta } from '@app/model/data';
import { ActorFormResultData } from '@lore/component';
import { Payload } from '@lore/store/actions';
import { ActorDeltaEntity } from '@lore/store/reducers/actor-delta.reducer';
import { createAction } from '@ngrx/store';

export interface ForActorDelta {
	delta: Partial<ActorDeltaEntity>;
	update?: Partial<ActorDeltaEntity>
}
export interface ForActorDeltas {
	forActor: Partial<Actor>;
	updates: Array<Partial<ActorDeltaEntity>>;
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
	(payload: Payload<ForActorDelta>) => payload
);
export const createActorDeltaFailure = createAction(
	`[ActorDelta] Create Failure`,
	(payload: Payload<ForActorDeltaError>) => payload
);

// Updating existing objects
export const updateActorDelta = createAction(
	`[ActorDelta] Update`,
	(payload: Payload<Partial<ActorDeltaEntity>>)=> payload
);

export const updateActorDeltaSuccess = createAction(
	`[ActorDelta] Update Success`,
	(payload: Payload<ForActorDelta>) => payload
);
export const updateActorDeltaFailure = createAction(
	`[ActorDelta] Update Failure`,
	(payload: Payload<ForActorDeltaError>) => payload
);

// Deleting existing objects
export const deleteActorDelta = createAction(
	`[ActorDelta] Delete`,
	(payload: Payload<ForActorDelta>) => payload
);

export const deleteActorDeltaSuccess = createAction(
	`[ActorDelta] Delete Success`,
	(payload: Payload<ForActorDelta>) => payload
);
export const deleteActorDeltaFailure = createAction(
	`[ActorDelta] Delete Failure`,
	(payload: Payload<ForActorDeltaError>) => payload
);

export const setActorDeltaUnix = createAction(
	`[ActorDelta] Set Unix`,
	(payload: Payload<ForActorDelta>) => payload
);

export const setActorDeltaUnixSuccess = createAction(
	`[ActorDelta] Set Unix Success`,
	(payload: Payload<ForActorDelta>) => payload
);

export const setActorDeltaUnixFailure = createAction(
	`[ActorDelta] Set Unix Failure`,
	(payload: Payload<ForActorDelta>) => payload
);


export const setActorDeltaUnixOverride = createAction(
	`[ActorDelta] Set Unix Override`,
	(payload: Payload<ForActorDelta>) => payload
);

export const setActorDeltaUnixOverrideSuccess = createAction(
	`[ActorDelta] Set Unix Override Success`,
	(payload: Payload<ForActorDelta>) => payload
);

export const setActorDeltaUnixOverrideFailure = createAction(
	`[ActorDelta] Set Unix Override Failure`,
	(payload: Payload<ForActorDelta>) => payload
);
export const bakeActorDeltaUnixOverride = createAction(
	`[ActorDelta] Bake Unix Override`,
	(payload: Payload<ForActorDelta>) => payload
);

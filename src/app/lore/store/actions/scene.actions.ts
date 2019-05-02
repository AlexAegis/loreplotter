import { createAction } from '@ngrx/store';
import { Payload } from '@lore/store/actions/payload.inderface';

export const setPlaySpeed = createAction(`[Scene] Set Speed`, (payload: Payload<number>): Payload<number> => payload);

export const setPlaySpeedSuccess = createAction(
	`[Scene] Set Speed Success`,
	(payload: Payload<number>): Payload<number> => payload
);
export const setPlaySpeedFailure = createAction(`[Scene] Set Speed Failure`, (payload: Payload<Error>) => ({ payload }));


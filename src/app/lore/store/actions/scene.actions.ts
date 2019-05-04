import { createAction } from '@ngrx/store';
import { Payload } from '@lore/store/actions/payload.interface';

export const setPlaySpeed = createAction(`[Scene] Set Speed`, (payload: Payload<number>): Payload<number> => payload);

export const setPlaying = createAction(`[Scene] Set Playing`, (payload: Payload<boolean>): Payload<boolean> => payload);

export const _play = createAction(`[Scene] Play`, (payload: Payload<boolean>): Payload<boolean> => payload);
export const _stop = createAction(`[Scene] Stop`, (payload: Payload<boolean>): Payload<boolean> => payload);

export const changeCursorBy = createAction(
	`[Scene] Change Cursor By`,
	(payload: Payload<number>): Payload<number> => payload
);
export const changeCursorOverrideTo = createAction(
	`[Scene] Set Cursor Override`,
	(payload: Payload<number>): Payload<number> => payload
);
export const bakeCursorOverride = createAction(
	`[Scene] Bake Cursor Override`,
	(payload: Payload<boolean>): Payload<boolean> => payload
);

export const setFrameTo = createAction(
	`[Scene] Set Frame`,
	(payload: Payload<{ start: number; end: number }>): Payload<{ start: number; end: number }> => payload
);
export const setFrameStartTo = createAction(
	`[Scene] Set Frame Start`,
	(payload: Payload<number>): Payload<number> => payload
);
export const setFrameStartDeltaTo = createAction(
	`[Scene] Set Frame Start Delta`,
	(payload: Payload<number>): Payload<number> => payload
);
export const setFrameEndTo = createAction(
	`[Scene] Set Frame End`,
	(payload: Payload<number>): Payload<number> => payload
);
export const setFrameEndDeltaTo = createAction(
	`[Scene] Set Frame End Delta`,
	(payload: Payload<number>): Payload<number> => payload
);
export const setFrameDeltaTo = createAction(
	`[Scene] Set Frame Delta`,
	(payload: Payload<{ start: number; end: number }>): Payload<{ start: number; end: number }> => payload
);

export const bakeFrameStart = createAction(
	`[Scene] Bake Frame Start`,
	(payload: Payload<boolean>): Payload<boolean> => payload
);
export const bakeFrameEnd = createAction(
	`[Scene] Bake Frame End`,
	(payload: Payload<boolean>): Payload<boolean> => payload
);
export const bakeFrame = createAction(`[Scene] Bake Frame`, (payload: Payload<boolean>): Payload<boolean> => payload);

export const changeFrameBy = createAction(
	`[Scene] Change Frame`,
	(payload: Payload<{ start: number; end: number }>): Payload<{ start: number; end: number }> => payload
);

export const setContainerWidth = createAction(
	`[Scene] Set Container Width`,
	(payload: Payload<number>): Payload<number> => payload
);

export const _timelineRefresh = createAction(
	`[Scene] Timeline Refresh`,
	(payload: Payload<number>): Payload<number> => payload
);

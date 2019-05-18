import { ActorObject } from '@lore/engine/object';
import { Payload } from '@lore/store/actions/payload.interface';
import { InteractionMode } from '@lore/store/reducers';
import { createAction } from '@ngrx/store';
import { Vector3 } from 'three';

export const setPlaySpeed = createAction(`[Scene] Set Speed`, (payload: Payload<number>): Payload<number> => payload);
export const changePlaySpeed = createAction(
	`[Scene] Change Speed`,
	(payload: Payload<number>): Payload<number> => payload
);
export const changePlayDirection = createAction(
	`[Scene] Change Direction`,
	(payload: Payload<number>): Payload<number> => payload
);
export const setPlaying = createAction(`[Scene] Set Playing`, (payload: Payload<boolean>): Payload<boolean> => payload);
export const setPlayingSuccess = createAction(
	`[Scene] Set Playing Success`,
	(payload: Payload<boolean>): Payload<boolean> => payload
);
export const setPlayingFailure = createAction(`[Scene] Set Playing Failure`, (payload: Payload<Error>) => ({
	payload
}));

export const togglePlaying = createAction(
	`[Scene] Toggle Playing`,
	(payload: Payload<undefined>): Payload<undefined> => payload
);

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

export const clearCursorOverride = createAction(
	`[Scene] Clear Cursor Override`,
	(payload: Payload<undefined>): Payload<undefined> => payload
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

export const setInteractionMode = createAction(
	`[Scene] Set Interaction Mode`,
	(payload: Payload<InteractionMode>): Payload<InteractionMode> => payload
);

export const setActorObjectSizeBias = createAction(
	`[Scene] Set Actor Object Size Bias`,
	(payload: Payload<number>): Payload<number> => payload
);

export const setDrawSize = createAction(
	`[Scene] Set Draw Size`,
	(payload: Payload<number>): Payload<number> => payload
);

export const setDrawHeight = createAction(
	`[Scene] Set Draw Height`,
	(payload: Payload<number>): Payload<number> => payload
);

export const setAutoLight = createAction(
	`[Scene] Set Auto Light`,
	(payload: Payload<boolean>): Payload<boolean> => payload
);

export const setManualLightAlwaysOn = createAction(
	`[Scene] Set Manual Light Always On`,
	(payload: Payload<boolean>): Payload<boolean> => payload
);

export const toggleAutoLight = createAction(
	`[Scene] Toggle Auto Light`,
	(): Payload<undefined> => ({ payload: undefined })
);

export const toggleManualLightAlwaysOn = createAction(
	`[Scene] Toggle Manual Light Always On`,
	(): Payload<undefined> => ({ payload: undefined })
);

export const actorSpawnOnWorld = createAction(
	`[Actor] Spawn On World`,
	(
		payload: Payload<{ actorObject: ActorObject; position: Vector3 }>
	): Payload<{ actorObject: ActorObject; position: Vector3 }> => payload
);

export const setSidebarOpen = createAction(
	`[Scene] Set Sidebar Open`,
	(payload: Payload<boolean>): Payload<boolean> => payload
);

export const toggleSidebarOpen = createAction(`[Scene] Toggle Sidebar Open`);

export const setMediaLarge = createAction(
	`[Scene] Set Media Large`,
	(payload: Payload<boolean>): Payload<boolean> => payload
);

export const setDebugMode = createAction(
	`[Scene] Set Debug Mode`,
	(payload: Payload<boolean>): Payload<boolean> => payload
);

export const toggleDebugMode = createAction(`[Scene] Toggle Debug Mode`);

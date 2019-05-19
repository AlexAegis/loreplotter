import { toUnit } from '@app/function';
import { DeltaProperty, OverridableProperty } from '@app/model';
import {
	bakeCursorOverride,
	bakeFrame,
	bakeFrameEnd,
	bakeFrameStart,
	changeCursorBy,
	changeCursorOverrideTo,
	changeFrameBy,
	changePlayDirection,
	changePlaySpeed,
	clearCursorOverride,
	SceneActions,
	setActorObjectSizeBias,
	setAutoLight,
	setDebugMode,
	setDrawHeight,
	setDrawSize,
	setFrameDeltaTo,
	setFrameEndDeltaTo,
	setFrameEndTo,
	setFrameStartDeltaTo,
	setFrameStartTo,
	setFrameTo,
	setInteractionMode,
	setManualLightAlwaysOn,
	setMediaLarge,
	setPlaying,
	setPlayingFailure,
	setPlayingSuccess,
	setPlaySpeed,
	setSidebarOpen,
	toggleAutoLight,
	toggleDebugMode,
	toggleManualLightAlwaysOn,
	togglePlaying,
	toggleSidebarOpen
} from '@lore/store/actions';
import moment from 'moment';

export interface FrameState {
	start: Partial<DeltaProperty>;
	end: Partial<DeltaProperty>;
}

export interface CursorState {
	unix: Partial<OverridableProperty>;
}

export type InteractionMode = 'draw' | 'move' | 'raise' | 'lower';

export interface SceneState {
	loading: boolean;
	playSpeed: number;
	playing: boolean;
	cursor: CursorState;
	frame: FrameState;
	interactionMode: InteractionMode;
	actorObjectSizeBias: number;
	drawSize: number;
	drawHeight: number;
	manualLight: boolean;
	manualLightAlwaysOn: boolean;
	sidebarOpen: boolean;
	debugMode: boolean;
	mediaLarge: boolean; // Large screen or not (Like mobile)
	title: string; // Large screen or not (Like mobile)
}

export const initialSceneState: SceneState = {
	title: 'DAW',
	loading: false,
	playSpeed: 1200,
	playing: false,
	cursor: {
		unix: {
			original: moment().unix(),
			override: undefined
		}
	},
	frame: {
		start: {
			base: moment()
				.subtract(2, 'week')
				.unix(),
			delta: undefined
		},
		end: {
			base: moment()
				.add(2, 'week')
				.unix(),
			delta: undefined
		}
	},
	actorObjectSizeBias: 0,
	interactionMode: 'move',
	drawSize: 10,
	drawHeight: 1,
	manualLight: true,
	debugMode: false,
	manualLightAlwaysOn: false,
	sidebarOpen: false, // Will be set correctly on application startup
	mediaLarge: false // Will be set correctly on application startup
};

function cursorReducer(cursor: CursorState, action: SceneActions): CursorState {
	switch (action.type) {
		case changeCursorBy.type: {
			return { ...cursor, unix: { ...cursor.unix, original: cursor.unix.original + action.payload } };
		}
		case changeCursorOverrideTo.type: {
			return { ...cursor, unix: { ...cursor.unix, override: action.payload } };
		}
		case bakeCursorOverride.type: {
			return {
				...cursor,
				unix: { ...cursor.unix, original: cursor.unix.override || cursor.unix.original, override: undefined }
			};
		}
		case clearCursorOverride.type: {
			return { ...cursor, unix: { ...cursor.unix, override: undefined } };
		}
		default: {
			return cursor;
		}
	}
}

export const MIN_FRAME_SIZE = 86400;

function frameReducer(frame: FrameState, action: SceneActions): FrameState {
	switch (action.type) {
		case setFrameTo.type: {
			let start = action.payload.start || frame.start.base;
			let end = action.payload.end || frame.end.base;

			if (Math.abs(end - start) <= MIN_FRAME_SIZE || end <= start) {
				return frame;
			} else {
				return {
					...frame,
					start: { ...frame.start, base: start },
					end: { ...frame.end, base: end }
				};
			}
		}
		case setFrameStartTo.type: {
			let start = action.payload || frame.start.base;
			let end = frame.end.base;

			if (Math.abs(end - start) <= MIN_FRAME_SIZE || end <= start) {
				return frame;
			}
			return { ...frame, start: { ...frame.start, base: action.payload || frame.start.base } };
		}
		case setFrameEndTo.type: {
			let start = frame.start.base;
			let end = action.payload || frame.end.base;

			if (Math.abs(end - start) <= MIN_FRAME_SIZE || end <= start) {
				return frame;
			}
			return { ...frame, end: { ...frame.end, base: action.payload || frame.end.base } };
		}
		case setFrameDeltaTo.type: {
			return {
				...frame,
				start: { ...frame.start, delta: action.payload.start },
				end: { ...frame.end, delta: action.payload.end }
			};
		}
		case setFrameStartDeltaTo.type: {
			return { ...frame, start: { ...frame.start, delta: action.payload } };
		}
		case setFrameEndDeltaTo.type: {
			return { ...frame, end: { ...frame.end, delta: action.payload } };
		}
		case bakeFrame.type: {
			const bakedStart = frame.start.base + frame.start.delta;
			const bakedEnd = frame.end.base + frame.end.delta;
			return {
				...frame,
				start: { ...frame.start, base: bakedStart, delta: undefined },
				end: { ...frame.end, base: bakedEnd, delta: undefined }
			};
		}
		case bakeFrameStart.type: {
			const bakedStart = frame.start.base + frame.start.delta;
			return { ...frame, start: { ...frame.start, base: bakedStart, delta: undefined } };
		}
		case bakeFrameEnd.type: {
			const bakedEnd = frame.end.base + frame.end.delta;
			return { ...frame, end: { ...frame.end, base: bakedEnd, delta: undefined } };
		}
		case changeFrameBy.type: {
			let start = (action.payload.start || 0) + frame.start.base;
			let end = (action.payload.end || 0) + frame.end.base;

			if (Math.abs(end - start) <= MIN_FRAME_SIZE || end <= start) {
				return frame;
			}
			return {
				...frame,
				start: { ...frame.start, base: start },
				end: { ...frame.end, base: end }
			};
		}
		default: {
			return frame;
		}
	}
}

export function sceneReducer(state: SceneState = initialSceneState, action: SceneActions): SceneState {
	switch (action.type) {
		case setPlaySpeed.type: {
			return {
				...state,
				playSpeed: action.payload.retainDirection
					? Math.abs(action.payload.speed) * (toUnit(state.playSpeed) || 1)
					: action.payload.speed
			};
		}
		case changePlaySpeed.type: {
			const target = state.playSpeed + (toUnit(state.playSpeed) || 1) * action.payload;
			return {
				...state,
				playSpeed: toUnit(state.playSpeed) === toUnit(target) || state.playSpeed === 0 ? target : 0
			};
		}
		case changePlayDirection.type: {
			return {
				...state,
				playSpeed: (action.payload || -toUnit(state.playSpeed)) * Math.abs(state.playSpeed)
			};
		}
		case setPlaying.type: {
			return { ...state, loading: true };
		}
		case setPlayingSuccess.type: {
			return { ...state, playing: action.payload, loading: false };
		}
		case setPlayingFailure.type: {
			return { ...state, loading: false };
		}
		case togglePlaying.type: {
			return { ...state, playing: !state.playing };
		}
		case setInteractionMode.type: {
			return { ...state, interactionMode: action.payload };
		}
		case setActorObjectSizeBias.type: {
			return { ...state, actorObjectSizeBias: action.payload };
		}
		case setDrawSize.type: {
			return { ...state, drawSize: action.payload };
		}
		case setDrawHeight.type: {
			return { ...state, drawHeight: action.payload };
		}
		case setAutoLight.type: {
			return { ...state, manualLight: action.payload };
		}
		case setManualLightAlwaysOn.type: {
			return { ...state, manualLightAlwaysOn: action.payload };
		}
		case toggleAutoLight.type: {
			return { ...state, manualLight: !state.manualLight };
		}
		case toggleManualLightAlwaysOn.type: {
			return { ...state, manualLightAlwaysOn: !state.manualLightAlwaysOn };
		}
		case setSidebarOpen.type: {
			return { ...state, sidebarOpen: action.payload };
		}
		case toggleSidebarOpen.type: {
			return { ...state, sidebarOpen: !state.sidebarOpen };
		}
		case setMediaLarge.type: {
			return { ...state, mediaLarge: action.payload };
		}
		case setDebugMode.type: {
			return { ...state, debugMode: action.payload };
		}
		case toggleDebugMode.type: {
			return { ...state, debugMode: !state.debugMode };
		}
		case changeCursorBy.type:
		case changeCursorOverrideTo.type:
		case bakeCursorOverride.type:
		case clearCursorOverride.type: {
			return { ...state, cursor: cursorReducer(state.cursor, action) };
		}
		case setFrameTo.type:
		case setFrameStartTo.type:
		case setFrameEndTo.type:
		case setFrameDeltaTo.type:
		case setFrameStartDeltaTo.type:
		case setFrameEndDeltaTo.type:
		case bakeFrame.type:
		case bakeFrameStart.type:
		case bakeFrameEnd.type:
		case changeFrameBy.type: {
			return { ...state, frame: frameReducer(state.frame, action) };
		}
		default: {
			return state;
		}
	}
}

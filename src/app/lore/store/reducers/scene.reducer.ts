import { DeltaProperty, OverridableProperty } from '@app/model';
import {
	bakeCursorOverride,
	bakeFrame,
	bakeFrameEnd,
	bakeFrameStart,
	changeCursorBy,
	changeCursorOverrideTo,
	changeFrameBy,
	clearCursorOverride,
	SceneActions,
	setActorObjectSizeBias,
	setAutoLight,
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
	setPlaying,
	setPlayingFailure,
	setPlayingSuccess,
	setPlaySpeed,
	toggleAutoLight,
	toggleManualLightAlwaysOn,
	togglePlaying
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
}

export const initialSceneState: SceneState = {
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
	manualLightAlwaysOn: false
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
			return { ...cursor, unix: { ...cursor.unix, original: cursor.unix.override, override: undefined } };
		}
		case clearCursorOverride.type: {
			return { ...cursor, unix: { ...cursor.unix, override: undefined } };
		}
		default: {
			return cursor;
		}
	}
}

function frameReducer(frame: FrameState, action: SceneActions): FrameState {
	switch (action.type) {
		case setFrameTo.type: {
			return {
				...frame,
				start: { ...frame.start, base: action.payload.start },
				end: { ...frame.end, base: action.payload.end }
			};
		}
		case setFrameStartTo.type: {
			return { ...frame, start: { ...frame.start, base: action.payload } };
		}
		case setFrameEndTo.type: {
			return { ...frame, end: { ...frame.end, base: action.payload } };
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
			return {
				...frame,
				start: { ...frame.start, base: frame.start.base + action.payload.start },
				end: { ...frame.end, base: frame.end.base + action.payload.end }
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
			return { ...state, playSpeed: action.payload };
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

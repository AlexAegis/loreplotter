import {
	SceneActions,
	changeCursorBy,
	setPlaying,
	setPlaySpeed,
	changeCursorOverrideTo,
	bakeCursorOverride,
	setFrameTo,
	setFrameStartTo,
	setFrameEndTo,
	setFrameDeltaTo,
	setFrameStartDeltaTo,
	setFrameEndDeltaTo,
	bakeFrame,
	bakeFrameEnd,
	bakeFrameStart,
	changeFrameBy
} from '@lore/store/actions';
import moment from 'moment';
import { DeltaProperty, OverridableProperty } from '@app/model';

export interface FrameState {
	start: Partial<DeltaProperty>;
	end: Partial<DeltaProperty>;
}

export interface CursorState {
	unix: Partial<OverridableProperty>;
	position: Partial<DeltaProperty>;
}

export interface SceneState {
	loading: boolean;
	playSpeed: number;
	playing: boolean;
	cursor: CursorState;
	frame: FrameState;
	// timelineContainerWidth: number;
}

export const initialSceneState: SceneState = {
	loading: false,
	playSpeed: 1200,
	playing: false,
	cursor: {
		unix: {
			original: moment('2019-01-03T12:00:00').unix(),
			override: undefined
		},
		position: {
			base: 0,
			delta: undefined
		}
	},
	frame: {
		start: {
			base: moment('2019-01-03T12:00:00')
				.subtract(2, 'week')
				.unix(),
			delta: undefined
		},
		end: {
			base: moment('2019-01-03T12:00:00')
				.add(2, 'week')
				.unix(),
			delta: undefined
		}
	}
	// timelineContainerWidth: window.innerWidth
};



function cursorReducer(cursor: CursorState, action: SceneActions) {
	switch (action.type) {
		case changeCursorBy.type: {
			return { ...cursor, unix: { ...cursor.unix, original: cursor.unix.original + action.payload } };
		}
		case changeCursorOverrideTo.type: {
			return { ...cursor, unix: { ...cursor.unix, override: action.payload } };
		}
		case bakeCursorOverride.type: {
			return { ...cursor, unix: { ...cursor.unix, original: cursor.unix.override, override: undefined } };
		}default: {
			return cursor;
		}
	}
}

function frameReducer(frame: FrameState, action: SceneActions): FrameState {
	// console.log('FRAAAAAAAAAAAAAAAAAAMEREDUUUCE');
	// console.log(action.type);
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
	// console.log('SceneReducer in action!');
	// console.log(state);
	// console.log(action);
	switch (action.type) {
		case setPlaySpeed.type: {
			return { ...state, playSpeed: action.payload };
		}
		case setPlaying.type: {
			return { ...state, playing: action.payload };
		}
		case changeCursorBy.type:
		case changeCursorOverrideTo.type:
		case bakeCursorOverride.type: {
			return  { ...state, cursor: cursorReducer(state.cursor, action) };
		}
		/*case setContainerWidth.type: {
			return { ...state, timelineContainerWidth: action.payload };
		}*/
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
			/*if (!action.type.startsWith(`_`)) {
				console.log(`No reducer defined for non-effect-only action: ${action.type}`);
			}*/
			return state;
		}
	}
}

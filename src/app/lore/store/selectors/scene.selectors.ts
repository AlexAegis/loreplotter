import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FeatureState, AppState } from '@lore/store/reducers';

const getFeatureState = createFeatureSelector<AppState, FeatureState>('app-lore');

const getSceneState = createSelector(
	getFeatureState,
	(state: FeatureState) => state.scene
);

const getLoadingScenes = createSelector(
	getSceneState,
	state => state.loading
);

const getPlaySpeed = createSelector(
	getSceneState,
	state => state.playSpeed
);

const isPlaying = createSelector(
	getSceneState,
	state => state.playing
);

const getCursorState = createSelector(
	getSceneState,
	state => state.cursor
);

const getCursorUnix = createSelector(
	getCursorState,
	state => state.unix.override || state.unix.original
);

const getCursorUnixOverride = createSelector(
	getCursorState,
	state => state.unix.override
);

const getCursorBasePosition = createSelector(
	getCursorState,
	state => state.position.base
);

const getCursorPosition = createSelector(
	getCursorState,
	state => state.position.base + (state.position.delta || 0)
);

const getFrameState = createSelector(
	getSceneState,
	state => state.frame
);

const getFrame = createSelector(
	getFrameState,
	state => {
		const start = state.start.base + (state.start.delta || 0);
		const end = state.end.base + (state.end.delta || 0);
		return {
			start,
			end,
			length: end - start
		};
	}
);

const getFrameStart = createSelector(
	getFrameState,
	state => state.start.base + (state.start.delta || 0)
);

const getFrameEnd = createSelector(
	getFrameState,
	state => state.end.base + (state.end.delta || 0)
);

const getInteractionMode = createSelector(
	getSceneState,
	state => state.interactionMode
);

const getDrawSize = createSelector(
	getSceneState,
	state => state.drawSize
);

const getDrawHeight = createSelector(
	getSceneState,
	state => state.drawHeight
);

const getAutoLight = createSelector(
	getSceneState,
	state => state.autoLight
);

const getManualLightAlwaysOn = createSelector(
	getSceneState,
	state => state.manualLightAlwaysOn
);

export const sceneQuery = {
	getLoadingScenes,
	getPlaySpeed,
	isPlaying,
	getFrame,
	getFrameStart,
	getFrameEnd,
	getCursorUnix,
	getCursorUnixOverride,
	getCursorBasePosition,
	getCursorPosition,
	getInteractionMode,
	getDrawSize,
	getDrawHeight,
	getAutoLight,
	getManualLightAlwaysOn
};

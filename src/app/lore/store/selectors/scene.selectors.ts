import { FeatureState } from '@lore/store/reducers';
import { getFeatureState } from '@lore/store/selectors/app-lore.selectors';
import { createSelector, resultMemoize } from '@ngrx/store';

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

const getUnix = createSelector(
	getCursorState,
	state => state.unix
);

const getCursor = createSelector(
	getUnix,
	unix => unix.override || unix.original
);

const getCursorOverride = createSelector(
	getUnix,
	unix => unix.override
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

const getActorObjectSizeBias = createSelector(
	getSceneState,
	state => state.actorObjectSizeBias
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

const isManualLight = createSelector(
	getSceneState,
	state => state.manualLight
);

const isManualLightAlwaysOn = createSelector(
	getSceneState,
	state => state.manualLightAlwaysOn
);

const isSidebarOpen = createSelector(
	getSceneState,
	state => state.sidebarOpen
);

const isMediaLarge = createSelector(
	getSceneState,
	state => state.mediaLarge
);

export const sceneQuery = {
	getLoadingScenes,
	play: {
		getPlaySpeed,
		isPlaying
	},
	frame: {
		getFrame,
		getFrameStart,
		getFrameEnd
	},
	cursor: {
		getCursor,
		getCursorOverride
	},
	interaction: {
		getInteractionMode,
		getActorObjectSizeBias,
		getDrawSize,
		getDrawHeight,
		isManualLight,
		isManualLightAlwaysOn
	},
	ui: {
		isSidebarOpen,
		isMediaLarge
	}
};

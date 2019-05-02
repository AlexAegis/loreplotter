import { createFeatureSelector, createSelector, } from '@ngrx/store';
import { SceneState, FeatureState, AppState } from '@lore/store/reducers';
import { getFeatureState } from '@lore/store/selectors/app-lore.selector';


const getSceneState = createSelector(
	getFeatureState,
	state => state.scene
);
const getLoadingScenes = createSelector(
	getSceneState,
	state => state.loading
);
const getPlaySpeed = createSelector(
	getSceneState,
	state => state.playSpeed
);

export const sceneQuery = {
	getLoadingScenes,
	getPlaySpeed,
};


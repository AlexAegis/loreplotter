import { ActionReducerMap } from '@ngrx/store';
import { State } from '@app/store/reducers';
import { loreReducer, LoreState } from '@lore/store/reducers/lore.reducer';
import { sceneReducer, SceneState } from '@lore/store/reducers/scene.reducer';
import { actorReducer, ActorState } from '@lore/store/reducers/actor.reducer';
import { AllActions } from '@lore/store/actions';

/**
 * Extending the root state with the lazy-feature module's own root-level entry
 */
export interface AppState extends State {
	'app-lore': FeatureState;
}

export interface FeatureState {
	lores: LoreState;
	scene: SceneState;
	actor: ActorState;
}

export const reducers: ActionReducerMap<FeatureState, AllActions> = {
	lores: loreReducer,
	scene: sceneReducer,
	actor: actorReducer,
};

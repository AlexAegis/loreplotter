import { State } from '@app/store/reducers';
import { FeatureActions } from '@lore/store/actions';
import { actorReducer, ActorState } from '@lore/store/reducers/actor.reducer';
import { loreReducer, LoreState } from '@lore/store/reducers/lore.reducer';
import { sceneReducer, SceneState } from '@lore/store/reducers/scene.reducer';
import { ActionReducerMap } from '@ngrx/store';

/**
 * Extending the root state with the lazy-feature module's own root-level entry
 */
export interface AppState extends State {
	app: FeatureState;
}

export interface FeatureState {
	lores: LoreState;
	scene: SceneState;
	actor: ActorState;
}

export const reducers: ActionReducerMap<FeatureState, FeatureActions> = {
	lores: loreReducer,
	scene: sceneReducer,
	actor: actorReducer
};

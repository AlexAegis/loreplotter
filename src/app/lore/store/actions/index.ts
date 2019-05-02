import { createAction, union } from '@ngrx/store';

import * as loreActions from './lore.actions';
import * as sceneActions from './scene.actions';

const allLoreActions = union(loreActions);
const allSceneActions = union(sceneActions);

export type LoreActions = typeof allLoreActions;
export type SceneActions = typeof allSceneActions;
export type AllActions = LoreActions | SceneActions;

export * from './lore.actions';
export * from './scene.actions';

export const voidOperation = createAction(`[Void]`, () => ({}));

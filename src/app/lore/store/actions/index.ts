import { createAction, union } from '@ngrx/store';
import * as actorDeltaActions from './actor-delta.actions';
import * as actorActions from './actor.actions';
import * as loreActions from './lore.actions';
import * as sceneActions from './scene.actions';

const allLoreActions = union(loreActions);
const allActorActions = union(actorActions);
const allActorDeltaActions = union(actorDeltaActions);
const allSceneActions = union(sceneActions);

export type LoreActions = typeof allLoreActions;
export type ActorActions = typeof allActorActions;
export type ActorDeltaActions = typeof allActorDeltaActions;
export type SceneActions = typeof allSceneActions;
export type FeatureActions = LoreActions | ActorActions | ActorDeltaActions | SceneActions;

export * from './lore.actions';
export * from './actor.actions';
export * from './actor-delta.actions';
export * from './scene.actions';

export const voidOperation = createAction(`[Void]`, () => ({}));

export * from './payload.interface';

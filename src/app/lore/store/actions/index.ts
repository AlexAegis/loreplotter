import * as actions from './lore.actions';

import { union } from '@ngrx/store';

const all = union(actions);

export type LoreActions = typeof all;

export * from './lore.actions';

import { createAction, union } from '@ngrx/store';

// TODO: Consider class with static members

export const loadLores = createAction('[Lore] Load', (payload: { offset?: number } = {}) => ({ payload }));

const all = union({
	loadLores
});

export type LoreActions = typeof all;

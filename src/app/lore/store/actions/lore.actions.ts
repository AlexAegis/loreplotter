import { createAction } from '@ngrx/store';
import { Lore } from '@app/model/data';
import { Update } from '@ngrx/entity';

export interface Payload<T> {
	payload: T;
}

// Initial lore object loading. While creating the RxDocuments needs to be stripped.
export const loadLores = createAction(`[Lore] Load`, (payload: Payload<any> = { payload: {} }) => ({ payload }));

export const loadLoresSuccess = createAction(
	`[Lore] Load Success`,
	(payload: Payload<Array<Lore>>): Payload<Array<Lore>> => payload
);
export const loadLoresFailure = createAction(`[Lore] Load Failure`, (payload: Payload<Error>) => ({ payload }));

// Further creations of lores are handled here
export const createLore = createAction(
	`[Lore] Create`,
	({ lore }: { lore: Lore }): Payload<Lore> => {
		return { payload: lore };
	}
);

export const createLoreSuccess = createAction(
	`[Lore] Create Success`,
	(payload: Payload<Partial<Lore>>): Payload<Partial<Lore>> => payload
);
export const createLoreFailure = createAction(`[Lore] Create Failure`, (payload: Payload<Error>) => ({ payload }));

// Updating existing objectsk
export const updateLore = createAction(`[Lore] Update`, (payload: Payload<Update<Lore>>) => ({ payload }));

export const updateLoreSuccess = createAction(`[Lore] Update Success`, (payload: Payload<Update<Lore>>) => ({
	payload
}));
export const updateLoreFailure = createAction(`[Lore] Update Failure`, (payload: Payload<Error>) => ({ payload }));

// Deleting existing objects
export const deleteLore = createAction(`[Lore] Delete`, (payload = {}) => ({ payload }));

export const deleteLoreSuccess = createAction(`[Lore] Delete Success`, (payload = {}) => ({ payload }));
export const deleteLoreFailure = createAction(`[Lore] Delete Failure`, (payload: Payload<Error>) => ({ payload }));

export const changeSelectedLore = createAction(`[Lore] Change Current`, (payload: Payload<Partial<Lore>>) => (
	payload
));

export const changeSelectedLoreSuccess = createAction(`[Lore] Change Current Success`, (payload: Payload<Partial<Lore>>) => (
	payload
));
export const changeSelectedLoreFailure = createAction(`[Lore] Change Current Failure`, (payload: Payload<Error>) => ({
	payload
}));

export const voidOperation = createAction(`[Void]`, () => ({}));

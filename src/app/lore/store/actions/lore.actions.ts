import { Lore } from '@app/model/data';
import { Payload } from '@lore/store/actions';
import { createAction } from '@ngrx/store';

// Initial lore object loading. While creating the RxDocuments needs end be stripped.
export const loadLores = createAction(`[Lore] Load`, (payload: Payload<Array<Lore>>): Payload<Array<Lore>> => payload);

export const loadLoresSuccess = createAction(
	`[Lore] Load Success`,
	(payload: Payload<Array<Lore>>): Payload<Array<Lore>> => payload
);
export const loadLoresFailure = createAction(`[Lore] Load Failure`, (payload: Payload<Error>) => ({ payload }));

// Further creations of lores are handled here
export const createLore = createAction(
	`[Lore] Create`,
	(payload: Payload<{ tex: Blob } & Lore>): Payload<{ tex: Blob } & Lore> => payload
);

export const createLoreSuccess = createAction(
	`[Lore] Create Success`,
	(payload: Payload<Partial<Lore>>): Payload<Partial<Lore>> => payload
);
export const createLoreFailure = createAction(`[Lore] Create Failure`, (payload: Payload<Error>) => ({ payload }));

// Updating existing objectsk
export const updateLore = createAction(
	`[Lore] Update`,
	(payload: Payload<{ tex: Blob } & Partial<Lore>>): Payload<{ tex: Blob } & Partial<Lore>> => payload
);

export const updateLoreSuccess = createAction(`[Lore] Update Success`, (payload: Payload<Partial<Lore>>) => ({
	payload
}));
export const updateLoreFailure = createAction(`[Lore] Update Failure`, (payload: Payload<Error>) => ({ payload }));

// Deleting existing objects
export const deleteLore = createAction(`[Lore] Delete`, (payload: Payload<string>): Payload<string> => payload);

export const deleteLoreSuccess = createAction(
	`[Lore] Delete Success`,
	(payload: Payload<string>): Payload<string> => payload
);
export const deleteLoreFailure = createAction(`[Lore] Delete Failure`, (payload: Payload<Error>) => ({ payload }));

export const changeSelectedLore = createAction(
	`[Lore] Change Selected`,
	(payload: Payload<string>): Payload<string> => payload
);

export const changeSelectedLoreSuccess = createAction(
	`[Lore] Change Selected Success`,
	(payload: Payload<Partial<Lore>>) => payload
);
export const changeSelectedLoreFailure = createAction(`[Lore] Change Selected Failure`, (payload: Payload<Error>) => ({
	payload
}));
/*
export const attachTexture = createAction(
	`[Lore] Attach Texture`,
	( { payload }: Payload<{ texture: Blob; lore: RxDocument<Lore> }>): Payload<{ texture: Blob; lore: RxDocument<Lore> }> => ({
		payload
	})
);
*/

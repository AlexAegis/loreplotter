export const ACTOR_DEFAULT_MAX_SPEED = 4;
export const ACTOR_DEFAULT_COLOR = `#1a56e6`;

/**
 * Should be serializable on its own
 */
export interface Actor {
	id: string;
	loreId: string;
	_userdata?: {}; // handled as transient TODO use ngrx state and attach by id
}

import { RxJsonSchema } from 'rxdb';

export const actorSchema: RxJsonSchema = {
	title: 'Actor',
	description: 'Actor Object, holds a series of events',
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		id: {
			type: 'string',
			primary: true
		},
		loreId: {
			type: 'string',
			ref: 'lore'
		}
	},
	required: ['id', 'loreId']
};

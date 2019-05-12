
export const PLANET_DEFAULT_NAME = 'Earth';
export const PLANET_DEFAULT_RADIUS = 6371;
/**
 *
 */
export interface Planet {
	name: string;
	radius: number;
}

import { RxJsonSchema } from 'rxdb';

export const planetSchema: RxJsonSchema = {
	title: 'Planet',
	description: 'Planet Object, describes a planets radius and textures',
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		radius: {
			type: 'number'
		},
		name: {
			type: 'string'
		}
	},
	required: ['radius']
};

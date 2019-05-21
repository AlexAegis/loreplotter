import { RxJsonSchema } from 'rxdb';
import { Planet } from '../data';

export const planetSchema: RxJsonSchema<Planet> = {
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

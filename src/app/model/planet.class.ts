import { RxJsonSchema } from 'rxdb';

/**
 *
 */
export class Planet {
	constructor(public name?: string, public radius?: number) {}
}

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

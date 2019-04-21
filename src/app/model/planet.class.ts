import { Tree } from '@alexaegis/avl';
import { RxJsonSchema } from 'rxdb';

import { ActorDelta } from './actor-delta.class';
import { UnixWrapper } from './unix-wrapper.class';

/**
 * Should be serializable on its own
 */
export class Planet {
	constructor(radius?: number, displacementTexture?: string) {
		this.radius = radius;
		this.displacementTexture = displacementTexture;
	}
	public radius: number;
	public displacementTexture: string;
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
		displacementTexture: {
			type: 'string'
		}
	},
	required: ['radius']
};

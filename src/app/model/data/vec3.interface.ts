import { RxJsonSchema } from 'rxdb';

export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

export const vec3Schema: RxJsonSchema = {
	title: 'Vector3',
	description: `Position`,
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		x: {
			type: 'number',
		},
		y: {
			type: 'number',
		},
		z: {
			type: 'number',
		}
	},
	required: ['x', 'y', 'z']
};

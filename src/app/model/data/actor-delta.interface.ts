import { Property, propertySchema } from '@app/model/data/property.interface';
import { Vec3, vec3Schema } from '@app/model/data/vec3.interface';
import { RxJsonSchema } from 'rxdb';

export interface ActorDelta {
	id: string;
	actorId: string;
	unix: number;
	name?: string;
	maxSpeed?: number;
	color?: string;
	position?: Vec3;
	properties?: Array<Property>;
}

export const actorDeltaSchema: RxJsonSchema = {
	title: 'ActorDeltaPosition',
	description: `Actor's position`,
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		id: {
			type: 'string',
			primary: true
		},
		actorId: {
			type: 'string',
			ref: 'actor'
		},
		unix: {
			type: 'number'
		},
		name: {
			type: 'string',
		},
		maxSpeed: {
			type: 'number',
		},
		color: {
			type: 'string',
		},
		position: vec3Schema,
		properties: {
			type: 'array',
			uniqueItems: false,
			default: [],
			items: propertySchema
		},
	},
	required: ['id', 'actorId', 'unix']
};

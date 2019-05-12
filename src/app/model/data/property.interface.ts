import { RxJsonSchema } from 'rxdb';

export interface Property {
	key: string;
	value: string;
}

export const propertySchema: RxJsonSchema = {
	title: 'Property',
	description: `A property, key value pair`,
	version: 0,
	keyCompression: true,
	type: 'object',
	properties: {
		key: {
			type: 'string',
		},
		value: {
			type: 'string'
		},
	},
	required: ['key']
};

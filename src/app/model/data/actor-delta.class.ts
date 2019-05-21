import { Vector3Serializable } from '@app/model/data';
import { jsonMember, jsonObject, toJson, jsonArrayMember, TypedJSON } from 'typedjson';
import { Property } from './property.class';

@jsonObject
@toJson
export class ActorDelta {
	@jsonMember
	public name: string;
	@jsonMember
	public position: Vector3Serializable;
	@jsonArrayMember(() => new Property(), {
		isRequired: true,
		serializer: (m: Array<Property>) => TypedJSON.stringifyAsArray(m, Property),
		deserializer: (m: string) => TypedJSON.parseAsArray(m, Property)
	})
	public properties: Array<Property> = [];
	@jsonMember
	public maxSpeed: number;
	@jsonMember
	public color: string;

	public constructor(
		name?: string,
		position?: Vector3Serializable,
		properties: Array<Property> = new Array<Property>(),
		maxSpeed?: number,
		color?: string
	) {
		this.name = name;
		this.position = position;
		this.properties = properties;
		this.maxSpeed = maxSpeed;
		this.color = color;
	}
}

import { Vector3Serializable } from '@app/model/data';
import { jsonMapMember, jsonMember, jsonObject, toJson } from 'typedjson';

@jsonObject
@toJson
export class ActorDelta {
	@jsonMember
	public name: string;
	@jsonMember
	public position: Vector3Serializable;
	@jsonMapMember(String, String)
	public knowledge: Map<String, String>;
	@jsonMember
	public maxSpeed: number;
	@jsonMember
	public color: string;
	public constructor(
		name?: string,
		position?: Vector3Serializable,
		knowledge: Map<String, String> = new Map<String, String>(),
		maxSpeed?: number,
		color?: string
	) {
		this.name = name;
		this.position = position;
		this.knowledge = knowledge;
		this.maxSpeed = maxSpeed;
		this.color = color;
	}
}

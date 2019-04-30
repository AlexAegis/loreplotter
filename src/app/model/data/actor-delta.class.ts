import { jsonMember, jsonObject, toJson, jsonMapMember } from 'typedjson';

import { Vector3Serializable } from '@app/model/data';

@jsonObject
@toJson
export class ActorDelta {
	@jsonMember
	public name: string;
	@jsonMember
	public position: Vector3Serializable;
	@jsonMapMember(String, String)
	public knowledge: Map<String, String>;
	constructor(name?: string, position?: Vector3Serializable, knowledge: Map<String, String> = new Map()) {
		this.name = name;
		this.position = position;
		this.knowledge = knowledge;
	}
}

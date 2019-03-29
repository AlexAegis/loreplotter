import { Vector3 } from 'three';
import { jsonMember, jsonObject, toJson } from 'typedjson';

@jsonObject
@toJson
export class Vector3Serializable extends Vector3 {
	@jsonMember
	public x: number;
	@jsonMember
	public y: number;
	@jsonMember
	public z: number;
}
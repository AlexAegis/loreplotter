import { Spherical, Vector3 } from 'three';
import { jsonObject, jsonMember, toJson } from 'typedjson';
import { Vector3Serializable } from './vector3-serializable.interface';

@jsonObject
@toJson
export class ActorDelta {
	@jsonMember
	public name: string;
	@jsonMember
	public position: Vector3Serializable;
	@jsonMember
	public knowledge: string;
	constructor(name?: string, position?: Vector3Serializable, knowledge?: string) {
		this.name = name;
		this.position = position;
		this.knowledge = knowledge;
	}

	/**
	 * Reconstruct current state
	 * TODO: maybe a separate actor cache for storing all informations in queue like structures, so
	 * going forward in deltas would mean adding to those queues, reading data just means peeking
	 * the top. and stepping backwards would mean to pop the top everywhere we applied a new value
	 */
	flat(iterator: IterableIterator<ActorDelta>): ActorDelta {
		const result = new ActorDelta();
		for (const delta of iterator) {
			Object.keys(delta).forEach(key => {
				if (delta[key]) {
					result[key] = delta[key];
				}
			});

			if (delta === this) {
				break;
			}
		}
		return result;
	}
}

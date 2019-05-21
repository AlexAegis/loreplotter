import { jsonMember, jsonObject, toJson } from 'typedjson';

@jsonObject
@toJson
export class Property {
	@jsonMember
	public key: string;
	@jsonMember
	public value: string;

	public constructor(key?: string, value?: string) {
		this.key = key;
		this.value = value;
	}
}

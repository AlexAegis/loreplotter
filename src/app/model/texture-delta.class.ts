import { jsonMember, jsonObject, toJson } from 'typedjson';

@jsonObject
@toJson
export class TextureDelta {
	@jsonMember
	public textureDataURL: string;

	constructor(textureDataURL?: string) {
		this.textureDataURL = textureDataURL;
	}
}

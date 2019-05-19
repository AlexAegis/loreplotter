import { Comparable } from '@alexaegis/avl';
import { jsonMember, jsonObject } from 'typedjson';

@jsonObject
export class UnixWrapper implements Comparable<UnixWrapper> {
	@jsonMember
	public unix: number;

	public constructor(unix?: number) {
		this.unix = Math.floor(unix);
	}

	public compareTo(other: UnixWrapper): number {
		return this.unix - other.unix;
	}
}

import { jsonMember, jsonObject } from 'typedjson';
import { Comparable } from '@alexaegis/avl';

@jsonObject
export class UnixWrapper implements Comparable<UnixWrapper> {
	@jsonMember
	public unix: number;

	public constructor(unix?: number) {
		this.unix = unix;
	}

	public compareTo(other: UnixWrapper): number {
		return this.unix - other.unix;
	}
}

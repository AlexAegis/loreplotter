export class OverridableProperty<T = number> {
	public original: T;
	public override: T;

	public constructor(original: T) {
		this.original = original;
	}

	public get value(): T {
		return this.override !== undefined ? this.override : this.original;
	}

	public clear(): void {
		this.override = undefined;
	}
}

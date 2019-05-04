export class DeltaProperty {
	public base = 0;
	public delta = 0;

	public get total(): number {
		return this.base + this.delta;
	}

	public bake(threshold?: number): void {
		this.base = this.total % (threshold !== undefined ? threshold : Infinity);
		this.delta = 0;
	}

	public switch(): void {
		this.base = this.delta;
		this.delta = 0;
	}
}

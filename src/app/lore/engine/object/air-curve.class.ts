import { Curve, Vector3 } from 'three';

export class AirCurve extends Curve<Vector3> {
	constructor(private from: Vector3, private to: Vector3) {
		super();
	}

	getPoint(t) {
		const angle = this.from.angleTo(this.to);
		return new Vector3()
			.addVectors(
				this.from.clone().multiplyScalar(Math.sin((1 - t) * angle)),
				this.to.clone().multiplyScalar(Math.sin(t * angle))
			)
			.divideScalar(Math.sin(angle));
	}
}

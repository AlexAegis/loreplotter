import { Vector3 } from 'three';

export const arcIntersection = (() => {
	const _c1 = new Vector3();
	const _c2 = new Vector3();
	const _i1 = new Vector3();
	const _i2 = new Vector3();
	const _mid = new Vector3();
	return (p1: Vector3, pe1: Vector3, p2: Vector3, pe2: Vector3): Vector3 => {
		_c1.copy(p1).cross(pe1).normalize();
		_c2.copy(p2).cross(pe2).normalize();
		_i1.copy(_c1).cross(_c2).normalize();
		_i2.copy(_c2).cross(_c1).normalize();
		_mid.copy(p1).add(p2).add(pe1).add(pe2);
		return (_mid.dot(_i1) > 0 ? _i1 : _i2).normalize();
	};
})();

import { Vector3 } from 'three';

export function arcIntersection(p1: Vector3, pe1: Vector3, p2: Vector3, pe2: Vector3): Vector3 {
	const c1 = p1.clone().cross(pe1).normalize();
	const c2 = p2.clone().cross(pe2).normalize();
	const i1 = c1.clone().cross(c2).normalize();
	const i2 = c2.clone().cross(c1).normalize();
	const mid = p1
		.clone()
		.add(p2)
		.add(pe1)
		.add(pe2);
	return (mid.dot(i1) > 0 ? i1 : i2).normalize();
}

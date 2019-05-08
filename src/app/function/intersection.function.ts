import { Vector3 } from 'three';

export interface Circle {
	center: Vector3;
	radius: number;
}

export function intersection(c1: Circle, c2: Circle, radius: number): Array<Vector3> {
	const intersections: Array<Vector3> = [];

	// project to (x,y,z) with unit radius
	const x1: Vector3 = c1.center.clone().normalize();
	const x2: Vector3 = c2.center.clone().normalize();
	//console.log(x1, x2);
	// convert radii to radians:
	const r1: number = c1.radius / radius;
	const r2: number = c2.radius / radius;
	//console.log(c1.radius, radius);
	// compute the unique point x0
	const q: number = x1.clone().dot(x2);
	const q2: number = q * q;
	if (q2 == 1) {
		// no solution: circle centers are either the same or antipodal
		return intersections;
	}
	const a: number = (Math.cos(r1) - q * Math.cos(r2)) / (1 - q2);
	const b: number = (Math.cos(r2) - q * Math.cos(r1)) / (1 - q2);
	const x0: Vector3 = x1
		.clone()
		.setScalar(a)
		.add(x2.clone().setScalar(b));

	// we only have a solution if x0 is within the sphere - if not,
	// the circles are not touching.
	const x02: number = x0.clone().dot(x0);
	if (x02 > 1) {
		// no solution: circles not touching
		return intersections;
	}

	// get the normal vector:
	const n: Vector3 = x1.clone().cross(x2);
	const n2: number = n.clone().dot(n);
	if (n2 == 0) {
		// no solution: circle centers are either the same or antipodal
		return intersections;
	}

	// find intersections:
	const t: number = Math.sqrt((1 - x0.clone().dot(x0)) / n2);
	intersections.push(toPolar(x0.clone().add(n.clone().setScalar(t))));
	if (t > 0) {
		// there's only multiple solutions if t > 0
		intersections.push(toPolar(x0.clone().add(n.clone().setScalar(-t))));
	}
	return intersections;
}

/**
 * In radian instead of deg like in the example
 * @param a
 */
export function toPolar(a: Vector3): Vector3 {
	return new Vector3(Math.atan2(a.z, Math.sqrt(a.x * a.x + a.y * a.y)), Math.atan2(a.y, a.x));
}

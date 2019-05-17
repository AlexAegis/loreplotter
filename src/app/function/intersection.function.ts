import { Vector3 } from 'three';

export interface Circle {
	center: Vector3;
	radius: number; // In kilometer
}


/**
 * 1)
 * @param c1 first circle, radius in km, center in geocentric coordinates
 * @param c2 second circle, radius in km, center in geocentric coordinates
 * @param radius by default the earths default radius in KM
 */
export function intersection(c1: Circle, c2: Circle, radius: number): Array<Vector3> {
	const intersections: Array<Vector3> = [];

	// project to (x,y,z) with unit radius
	const x1: Vector3 = c1.center.clone().normalize();
	const x2: Vector3 = c2.center.clone().normalize();
	// convert radii to radians:
	const r1: number = c1.radius / radius;
	const r2: number = c2.radius / radius;
	// compute the unique point x0
	const q: number = x1.clone().dot(x2);
	const q2: number = q * q;
	if (q2 === 1) {
		// no solution: circle centers are either the same or antipodal
		return intersections;
	}
	const a: number = (Math.cos(r1) - q * Math.cos(r2)) / (1 - q2);
	const b: number = (Math.cos(r2) - q * Math.cos(r1)) / (1 - q2);
	const x0: Vector3 = x1
		.clone()
		.multiplyScalar(a)
		.add(x2.clone().multiplyScalar(b));

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
	if (n2 === 0) {
		// no solution: circle centers are either the same or antipodal
		return intersections;
	}

	// find intersections:
	const t: number = Math.sqrt((1 - x0.clone().dot(x0)) / n2);
	intersections.push(x0.clone().add(n.clone().multiplyScalar(t)));
	if (t > 0) {
		// there's only multiple solutions if t > 0
		intersections.push(x0.clone().add(n.clone().multiplyScalar(-t)));
	}
	return intersections;
}

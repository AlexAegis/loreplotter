import { Euler, Quaternion, Spherical, Vector3 } from 'three';

const look = new Vector3();

export function quaternionToSpherical(q: Quaternion, r = 1): Spherical {
	const s = new Spherical();
	new Euler().setFromQuaternion(q);
	look.set(0, 0, 1);
	look.applyQuaternion(q);
	look.normalize();
	if (Math.abs(look.x) < 0.001) {
		look.x = 0.001;
	}
	s.set(1, Math.acos(look.z / r), Math.atan2(look.y, look.x));
	return s;
}

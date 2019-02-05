import { Euler, Quaternion } from 'three';

export function invert(euler: Euler): Euler {
	return new Euler().setFromQuaternion(new Quaternion().setFromEuler(euler).inverse());
}

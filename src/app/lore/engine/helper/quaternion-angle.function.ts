import { Quaternion } from 'three';

/**
 * Calculates the angle between two quaternions
 * @param q1 angle start
 * @param q2 angle end
 * @return angle in radians
 */
export function quaternionAngle(q1: Quaternion, q2: Quaternion): number {
	const qd = q1
		.clone()
		.inverse()
		.multiply(q2);
	return 2 * Math.atan2(Math.sqrt(qd.x * qd.x + qd.y * qd.y + qd.z * qd.z), qd.w);
}

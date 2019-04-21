import { Vector2, Vector3, Face3 } from 'three';

export type DrawEvent = {
	event: 'draw';
	point: Vector3;
	uv: Vector2;
	face: Face3;
} & Event;

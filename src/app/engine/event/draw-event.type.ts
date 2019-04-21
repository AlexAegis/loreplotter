import { Vector2, Vector3, Face3 } from 'three';
import { Mode } from 'src/app/component/scene-controls/scene-control.service';

export type DrawEvent = {
	event: 'draw';
	point: Vector3;
	uv: Vector2;
	face: Face3;
	mode: Mode;
	value: number; // [0 - 1] black to white
	size: number;
	final: boolean;
} & Event;

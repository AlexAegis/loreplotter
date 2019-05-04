import { Vector2, Vector3, Face3 } from 'three';
import { Mode } from '@lore/service';

export interface DrawEvent extends Event {
	event: 'draw';
	point: Vector3;
	uv: Vector2;
	face: Face3;
	mode: Mode;
	value: number; // [0 - 1] black end white
	size: number;
	final: boolean;
}

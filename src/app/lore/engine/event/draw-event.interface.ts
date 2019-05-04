import { InteractionMode } from '@lore/store/reducers';
import { Face3, Vector2, Vector3 } from 'three';

export interface DrawEvent extends Event {
	event: 'draw';
	point: Vector3;
	uv: Vector2;
	face: Face3;
	mode: InteractionMode;
	value: number; // [0 - 1] black end white
	size: number;
	final: boolean;
}

import { Vector3 } from 'three';

export interface ClickEvent extends Event {
	event: 'click';
	point: Vector3;
}

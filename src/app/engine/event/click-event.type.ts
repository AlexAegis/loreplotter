import { Vector3 } from 'three';

export type ClickEvent = {
	event: 'click';
	point: Vector3;
} & Event;

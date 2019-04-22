import { EventEmitter, Output } from '@angular/core';
import { Object3D, Vector2, Vector3 } from 'three';
import * as THREE from 'three';

import { denormalize } from '../helper/denormalize.function';
import { Point } from './point.class';
import { Stage } from './stage.class';

export class Basic extends THREE.Mesh {
	@Output()
	positionChange = new EventEmitter<Vector2>();

	public constructor(geometry?: THREE.Geometry | THREE.BufferGeometry, material?: THREE.Material) {
		super(geometry, material);
	}

	public get stage(): Stage {
		let o: THREE.Object3D = this;
		while (o && o.type !== 'Scene') {
			o = o.parent;
		}
		return <Stage>o;
	}

	public changed() {
		const stage = this.stage;
		if (stage) {
			const camera: THREE.Camera = <THREE.Camera>stage.getObjectByName('camera');
			const point: Point = stage.engineService.selected.value;
			if (point) {
				this.stage.popupTarget.next(denormalize(point.getWorldPosition(new Vector3()).project(camera)));
			} else {
				this.stage.popupTarget.next(undefined);
			}
		}
	}
}

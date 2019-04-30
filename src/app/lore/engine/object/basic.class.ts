import { EventEmitter, Output } from '@angular/core';
import { Vector2 } from 'three';
import * as THREE from 'three';

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

	public changed() {}
}

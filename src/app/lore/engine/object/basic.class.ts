import { EventEmitter, Output } from '@angular/core';
import { Stage } from '@lore/engine/object/';
import { BufferGeometry, Geometry, Material, Mesh, Object3D, Vector2 } from 'three';

export class Basic extends Mesh {
	@Output()
	positionChange = new EventEmitter<Vector2>();

	public constructor(geometry?: Geometry | BufferGeometry, material?: Material) {
		super(geometry, material);
	}

	public get stage(): Stage {
		let o: Object3D = this;
		while (o && o.type !== 'Scene') {
			o = o.parent;
		}
		return <Stage>o;
	}

	public changed() {}
}

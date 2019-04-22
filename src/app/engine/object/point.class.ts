import * as THREE from 'three';

import { Interactive } from '../interfaces/interactive.interface';
import { Basic } from './basic.class';
import * as dat from 'dat.gui';

export class Point extends Basic implements Interactive {
	private defaultMaterial = new THREE.MeshBasicMaterial({
		wireframe: false,
		opacity: 0.8,
		transparent: false,
		color: 0xaa4444
	});

	private selectedMaterial = new THREE.MeshBasicMaterial({
		wireframe: true,
		opacity: 0.9,
		transparent: false,
		color: 0xaa4444
	});

	private highlightMaterial = new THREE.MeshBasicMaterial({
		wireframe: false,
		opacity: 0.6,
		transparent: false,
		color: 0xaa8888
	});

	constructor(public name: string) {
		super(new THREE.SphereBufferGeometry(0.05, 40, 40), undefined);
		this.type = 'Point';
		this.position.set(0, 0, 1); // TODO, radius
		this.rotateX(90 * THREE.Math.DEG2RAD);
		this.material = this.defaultMaterial;
		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method to enable fast raycasting, only works with Buffered Geometries
		this.addEventListener('click', attachment => {
			// this.stage.engineService.selected.next(this);
		});

		this.addEventListener('context', attachment => {
			this.stage.engineService.selected.next(this);
		});

		this.addEventListener('hover', attachment => {
			this.stage.engineService.hovered.next(this);
		});

		this.addEventListener('pan', event => {
			this.parent.lookAt(event.point);
			this.parent.userData.override = true;
		});
	}

	select() {
		this.material = this.selectedMaterial;
	}

	deselect() {
		this.material = this.defaultMaterial;
	}

	hover() {
		this.material = this.highlightMaterial;
	}

	unhover() {
		if (this.stage.engineService.selected.value === this) {
			this.select();
		} else {
			this.deselect();
		}
	}
}

import { Basic } from './basic.class';
import { Shader, Vector3, Quaternion, Euler } from 'three';
import { globeShader } from '../shader/globe.shader';

import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { Interactive } from '../interfaces/interactive.interface';
import { Globe } from './globe.class';

export class Point extends Basic implements Interactive {
	type = 'Point';

	private defaultMaterial = new THREE.MeshBasicMaterial({
		wireframe: false,
		opacity: 0.8,
		transparent: true,
		color: 0xaa4444
	});

	private selectedMaterial = new THREE.MeshBasicMaterial({
		wireframe: true,
		opacity: 0.9,
		transparent: true,
		color: 0xaa4444
	});

	private highlightMaterial = new THREE.MeshBasicMaterial({
		wireframe: false,
		opacity: 0.6,
		transparent: true,
		color: 0xaa8888
	});

	constructor(public name: string) {
		super(new THREE.BoxGeometry(0.1, 0.1, 0.1, 1, 1, 1), undefined);
		this.position.set(0, 0, 1);

		this.material = this.defaultMaterial;
		this.geometry.computeBoundingBox();

		this.addEventListener('click', attachment => {
			console.log(`point got clicked`);
			this.stage.engineService.selected.next(this);
		});

		this.addEventListener('hover', attachment => {
			this.stage.engineService.hovered.next(this);
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

import { Basic } from './basic.class';
import { Shader, Vector3, Quaternion, Euler } from 'three';
import { globeShader } from '../shader/globe.shader';

import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { Interactive } from '../interfaces/interactive.interface';
import { Globe } from './globe.class';
import { ClickEvent } from '../event/click-event.type';

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
		super(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 40), undefined);
		this.position.set(0, 0, 1);
		this.rotateX(90 * THREE.Math.DEG2RAD);
		this.material = this.defaultMaterial;
		this.geometry.computeBoundingBox();

		this.addEventListener('click', attachment => {
			// this.stage.engineService.selected.next(this);
		});

		this.addEventListener('context', attachment => {
			this.stage.engineService.selected.next(this);
		});

		this.addEventListener('hover', attachment => {
			this.stage.engineService.hovered.next(this);
		});
		this.addEventListener('pan', (event: ClickEvent) => {
			console.log(`hello pan! in point!`);
			console.log(event);
			this.parent.lookAt(event.point);
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

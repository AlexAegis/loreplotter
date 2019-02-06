import { Basic } from './basic.class';
import { Shader, Vector3, Quaternion, Euler } from 'three';
import { globeShader } from '../shader/globe.shader';

import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { Interactive } from '../interfaces/interactive.interface';

export class Point extends Basic implements Interactive {
	private defaultMaterial = new THREE.MeshBasicMaterial({
		wireframe: false,
		opacity: 0.8,
		transparent: true,
		color: 0xaa4444
	});

	private selectedMaterial = new THREE.MeshBasicMaterial({
		wireframe: true,
		opacity: 0.4,
		transparent: true,
		color: 0xaa4444
	});

	constructor() {
		super(new THREE.BoxGeometry(0.1, 0.1, 0.1, 1, 1, 1), undefined);

		this.material = this.defaultMaterial;
		this.geometry.computeBoundingBox();

		this.addEventListener('select', attachment => {
			console.log('I have been selected!' + attachment);
			if (this.scene.userData['selected']) {
				(<Interactive>this.scene.userData['selected']).deselect();
			}
			this.scene.userData['selected'] = this;
			this.select();
		});
	}

	select() {
		this.material = this.selectedMaterial;
	}

	deselect() {
		this.material = this.defaultMaterial;
	}

	highlight() {}
}

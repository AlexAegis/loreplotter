import { Shader, Vector3, Quaternion, Euler } from 'three';
import { globeShader } from '../shader/globe.shader';

import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';

export class Point extends THREE.Mesh {
	constructor() {
		super(
			new THREE.CubeGeometry(0.1, 0.1, 0.1, 1, 1, 1),
			new THREE.MeshBasicMaterial({
				wireframe: false,
				opacity: 0.8,
				transparent: true,
				color: 0xaa4444
			})
		);
		this.geometry.computeBoundingBox();
	}
}

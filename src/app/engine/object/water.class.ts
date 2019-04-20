import * as TWEEN from '@tweenjs/tween.js';
import { Group, Shader, Spherical, Vector3, Color, TextureLoader } from 'three';
import * as THREE from 'three';

import { globeShader } from '../shader/globe.shader';
import { ClickEvent } from '../event/click-event.type';
import { AirCurve } from './air-curve.class';
import { Basic } from './basic.class';

export class Water extends Basic {
	public type = 'Water';

	constructor(private radius: number = 0.98) {
		super(
			new THREE.SphereGeometry(radius, 70, 70),
			new THREE.MeshStandardMaterial({
				color: new Color('#389bff'),
				emissive: new Color('#389bff'),
				emissiveIntensity: 0.4,
				opacity: 0.8,
				transparent: true,
				alphaTest: 0.8
			})
		);
		this.name = 'water';
		this.castShadow = true;
		this.receiveShadow = true;
		this.geometry.computeBoundingSphere();
	}
}

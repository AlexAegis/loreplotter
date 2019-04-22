import { interval, of } from 'rxjs';
import * as TWEEN from '@tweenjs/tween.js';
import { Group, Shader, Spherical, Vector3, Color, TextureLoader, Texture, Vector2 } from 'three';
import * as THREE from 'three';

import { globeShader } from '../shader/globe.shader';
import { ClickEvent } from '../event/click-event.type';
import { AirCurve } from './air-curve.class';
import { Basic } from './basic.class';
import { withLatestFrom, delay } from 'rxjs/operators';

export class Water extends Basic {
	public type = 'Water';
	public texture: Texture;
	constructor(private radius: number = 0.98) {
		super(new THREE.SphereGeometry(radius, 128, 128), undefined);
		this.texture = new TextureLoader().load(`assets/textures/water/ripple.gif`, tex => {
			tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
			tex.offset.set(0, 0);
			tex.repeat.set(100, 100);
			tex.anisotropy = 4;
		}); // TODO: Animate the gif
		/*
		interval(1000 / 60)
			.pipe(
				delay(2000),
				withLatestFrom(of(this.texture))
			)
			.subscribe(([next, tex]) => {
				tex.needsUpdate = true;
			});*/

		// (this.geometry as any).computeBoundsTree(); // Use the injected method to enable fast raycasting, only works with Buffered Geometries
		this.material = new THREE.MeshPhysicalMaterial({
			color: new Color('#63a9ff'), // 63acff
			emissive: new Color('#1b3287'), // 2863a3
			emissiveIntensity: 0.02,
			opacity: 0.7,
			transparent: false,
			bumpMap: this.texture,
			bumpScale: 0.0001,
			roughness: 0.3,
			metalness: 0.8,
			reflectivity: 0.3,
			clearCoat: 0.9,
			clearCoatRoughness: 0.7
		});
		this.frustumCulled = false;
		this.name = 'water';
		this.castShadow = true;
		this.receiveShadow = true;
	}
}

import { interval, of } from 'rxjs';
import * as TWEEN from '@tweenjs/tween.js';
import { Group, Shader, Spherical, Vector3, Color, TextureLoader, Texture } from 'three';
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
		super(new THREE.SphereGeometry(radius, 70, 70), undefined);
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
		this.material = new THREE.MeshStandardMaterial({
			color: new Color('#389bff'),
			emissive: new Color('#389bff'),
			emissiveIntensity: 0.4,
			opacity: 0.8,
			transparent: true,
			alphaTest: 0.8
			// bumpMap: this.texture
		});
		this.name = 'water';
		this.castShadow = true;
		this.receiveShadow = true;
		this.geometry.computeBoundingSphere();
	}
}

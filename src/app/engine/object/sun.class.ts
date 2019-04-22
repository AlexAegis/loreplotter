import * as TWEEN from '@tweenjs/tween.js';
import {
	Group,
	Shader,
	Spherical,
	Vector3,
	Color,
	TextureLoader,
	Texture,
	Vector2,
	Vector,
	PointsMaterial,
	BufferGeometry,
	BufferAttribute,
	Light,
	DirectionalLight
} from 'three';
import * as THREE from 'three';

import { globeShader } from '../shader/globe.shader';
import { ClickEvent } from './../event/click-event.type';
import { AirCurve } from './air-curve.class';
import { Basic } from './basic.class';
import { Water } from './water.class';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { text } from '@fortawesome/fontawesome-svg-core';
import { DrawEvent } from '../event/draw-event.type';
import { Mode } from 'src/app/component/scene-controls/scene-control.service';
import { DynamicTexture } from './dynamic-texture.class';
import { Lensflare, LensflareElement } from 'three-full';

export class Sun extends Basic {
	public type = 'Sun';
	public material: THREE.MeshPhongMaterial; // Type override, this field exists on the THREE.Mesh already

	public displacementTexture: DynamicTexture;
	public emissionTexture: DynamicTexture;
	public directionalLight: DirectionalLight;
	public constructor(public radius: number = 0.6) {
		super();
		this.name = 'sun';

		this.material = new THREE.MeshPhongMaterial({
			emissive: '#ffd3a8',
			emissiveIntensity: 0.7,
			shininess: 0
		});

		// const sunGeometry = new THREE.Point();ffb370
		// sunGeometry.addAttribute('position', new BufferAttribute(new Float32Array(3), 3));

		/*this.material = new PointsMaterial({
			size: 100,
			sizeAttenuation: true,
			color: 0xffddaa,
			alphaTest: 0,
			transparent: true,
			fog: false
		}) as any;*/
		this.frustumCulled = false;
		/*texture.onUpdate = () => {
			console.log('-------- d9isp tex updated');
		};*/

		this.geometry = new THREE.SphereBufferGeometry(radius, 30, 30);
		// this.geometry = sunGeometry;
		this.geometry.normalizeNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method to enable fast raycasting, only works with Buffered Geometries
		this.addEventListener('click', (event: ClickEvent) => {
			console.log('You clicked the sun');
		});

		this.castShadow = false;
		this.directionalLight = new DirectionalLight(0xffd3a8, 0.6);
		this.directionalLight.castShadow = true;
		this.directionalLight.receiveShadow = true;

		this.add(this.directionalLight);
	}
}

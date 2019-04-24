import { Basic } from './basic.class';
import * as THREE from 'three';
import { SphereBufferGeometry } from 'three';
import { Globe } from './globe.class';

export class Atmosphere extends Basic {
	public mesh: THREE.Mesh;

	public scene: THREE.Scene;
	public camera: THREE.OrthographicCamera;

	public time: number;

	constructor(private planet: Globe) {
		super();

		this.geometry = new SphereBufferGeometry(planet.radius * 1.1, 80, 80);

		this.material = new THREE.MeshPhysicalMaterial({
			color: '#6266ff',
			side: THREE.BackSide,
			transparent: true,
			opacity: 0.02,
			emissive: '#6266ff',
			emissiveIntensity: 1
		});

		this.receiveShadow = false;
		this.castShadow = false;
	}
}

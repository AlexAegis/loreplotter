import { Basic } from './basic.class';
import { BackSide, Mesh, MeshPhysicalMaterial, OrthographicCamera, Scene, SphereBufferGeometry } from 'three';
import { Globe } from '@lore/engine/object';

export class Atmosphere extends Basic {
	public mesh: Mesh;

	public scene: Scene;
	public camera: OrthographicCamera;

	public time: number;

	constructor(private planet: Globe) {
		super();

		this.geometry = new SphereBufferGeometry(planet.radius * 1.1, 80, 80);

		this.material = new MeshPhysicalMaterial({
			color: '#6266ff',
			side: BackSide,
			transparent: true,
			opacity: 0.02,
			emissive: '#6266ff',
			emissiveIntensity: 1
		});

		this.receiveShadow = false;
		this.castShadow = false;
	}
}

import { ClickEvent } from '@lore/engine/event';
import { DirectionalLight, MeshPhongMaterial, SphereBufferGeometry } from 'three';
import { Basic } from './basic.class';

export class Sun extends Basic {
	public type = 'Sun';
	public material: MeshPhongMaterial; // Type override, this field exists on the THREE.Mesh already

	public directionalLight: DirectionalLight;
	public directionalLightBaseIntensity = 0.6;
	public constructor(public radius: number = 0.6) {
		super();
		this.name = 'sun';

		this.material = new MeshPhongMaterial({
			emissive: '#ffd3a8',
			emissiveIntensity: 0.7,
			shininess: 0
		});

		this.frustumCulled = false;

		this.geometry = new SphereBufferGeometry(radius, 30, 30);
		this.geometry.normalizeNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method end enable fast raycasting, only works with Buffered Geometries
		this.addEventListener('click', (event: ClickEvent) => {
			console.log('You clicked the sun');
		});

		this.castShadow = false;
		this.directionalLight = new DirectionalLight(0xffd3a8, this.directionalLightBaseIntensity);
		this.directionalLight.castShadow = true;
		this.directionalLight.receiveShadow = true;

		this.add(this.directionalLight);
	}
}

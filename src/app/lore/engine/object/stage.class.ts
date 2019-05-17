import { EngineService } from '@lore/engine/engine.service';
import { AmbientLight, Color, PerspectiveCamera, Scene } from 'three';
import { Sun } from './sun.class';

export class Stage extends Scene {
	public camera: PerspectiveCamera;
	public sun: Sun;
	public ambient: AmbientLight;

	public constructor(public engineService: EngineService) {
		super();

		this.name = 'stage';
		this.camera = new PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 10000);
		this.camera.name = 'camera';
		this.camera.position.z = 1000;
		this.camera.zoom = window.innerHeight / 2;
		this.camera.updateProjectionMatrix();
		this.add(this.camera);
		this.background = new Color('#121212');

		this.sun = new Sun();
		// this.sun.directionalLight.target = this.engineService.globe;
		this.add(this.sun);

		// light mode
		this.ambient = new AmbientLight('#ffd3a8', 1.2);
		this.add(this.ambient);
		// soft white light
		// this.light = new THREE.AmbientLight(0x002020);
		// this.light.position.z = 100;
		// this.light.intensity = 0;
		// this.add(this.light);
		// this.fog = new THREE.Fog(0x2040aa, 2, 100);
	}
}

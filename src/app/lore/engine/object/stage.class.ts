import { EngineService } from '@lore/engine/engine.service';
import { AmbientLight, Color, PerspectiveCamera, Scene } from 'three';
import { Sun } from './sun.class';

export class Stage extends Scene {
	public camera: PerspectiveCamera;
	public sun: Sun;
	public ambient: AmbientLight;
	public baseAmbientIntensity = 2.6;

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
		this.add(this.sun);

		// light mode
		this.ambient = new AmbientLight('#d3f3ff', this.baseAmbientIntensity);
		this.add(this.ambient);
		// soft white light
	}
}

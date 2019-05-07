import { EngineService } from '@lore/engine/engine.service';
import { AmbientLight, Color, Group, PerspectiveCamera, Scene } from 'three';
import { Sun } from './sun.class';

export class Stage extends Scene {
	public camera: PerspectiveCamera;
	public sunGroup: Group;
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

		this.sunGroup = new Group();
		this.sun = new Sun();
		this.sunGroup.add(this.sun);
		this.sun.position.set(40, 0, 0);
		this.sunGroup.position.set(0, 0, 0);
		this.sun.directionalLight.target = this.sunGroup;
		this.add(this.sunGroup);

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

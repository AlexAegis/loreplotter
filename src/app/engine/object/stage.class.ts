import { BehaviorSubject } from 'rxjs';
import * as THREE from 'three';
import { Vector2, Vector3, TextureLoader } from 'three';
import { EngineService } from '../engine.service';
import { Lensflare, LensflareElement } from 'three-full';
export class Stage extends THREE.Scene {
	public camera: THREE.OrthographicCamera;
	// private light: THREE.AmbientLight;

	// Target of the popup TODO: Change this back to undefined after experimenting
	public popupTarget = new BehaviorSubject<Vector2>(undefined);

	constructor(public engineService: EngineService) {
		super();

		this.name = 'stage';
		// this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera = new THREE.OrthographicCamera(
			window.innerWidth / -2,
			window.innerWidth / 2,
			window.innerHeight / 2,
			window.innerHeight / -2,
			0.1,
			100
		);
		this.camera.name = 'camera';
		this.camera.position.z = 12;
		this.camera.zoom = window.innerHeight / 2;
		this.camera.updateProjectionMatrix();
		this.add(this.camera);
		this.background = new THREE.Color('#fafafa');

		const light = new THREE.PointLight(0x48443e, 0.8, 1000);
		light.castShadow = true;
		const flareSun = new TextureLoader().load(`assets/textures/lensflare/lensflare-sun.png`);

		const lensflare = new Lensflare();

		lensflare.addElement(new LensflareElement(flareSun, 250, 0));

		light.add(lensflare);
		light.position.set(10, 10, 10);
		this.add(light);

		// soft white light
		// this.light = new THREE.AmbientLight(0x002020);
		// this.light.position.z = 100;
		// this.light.intensity = 0;
		// this.add(this.light);
		// this.fog = new THREE.Fog(0x2040aa, 2, 100);
	}
}

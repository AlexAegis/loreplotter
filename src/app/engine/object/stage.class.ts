import { BehaviorSubject } from 'rxjs';
import * as THREE from 'three';
import {
	Vector2,
	Vector3,
	TextureLoader,
	Scene,
	OrthographicCamera,
	Color,
	Mesh,
	AmbientLight,
	MeshBasicMaterial,
	IcosahedronGeometry,
	Object3D,
	PerspectiveCamera,
	Group
} from 'three';
import { EngineService } from '../engine.service';
import { Lensflare, LensflareElement } from 'three-full';
import { Sun } from './sun.class';
import { Basic } from './basic.class';
import { Atmosphere } from './atmosphere.class';
export class Stage extends Scene {
	public camera: PerspectiveCamera;
	public sunGroup: Group;
	public pseudoSunGroup: Group;
	public sun: Sun;
	// private light: THREE.AmbientLight;

	public popupTarget = new BehaviorSubject<Vector2>(null);

	constructor(public engineService: EngineService) {
		super();

		this.name = 'stage';
		this.camera = new PerspectiveCamera(120, window.innerWidth / window.innerHeight, 0.1, 10000);
		/*this.camera = new OrthographicCamera(
			window.innerWidth / -2,
			window.innerWidth / 2,
			window.innerHeight / 2,
			window.innerHeight / -2,
			0.1,
			10000
		);*/
		this.camera.name = 'camera';
		this.camera.position.z = 1000;
		this.camera.zoom = window.innerHeight / 2;
		this.camera.updateProjectionMatrix();
		this.add(this.camera);
		// this.background = new THREE.Color('#fafafa');
		// this.background = new Color('#5e81b2');
		this.background = new Color('#121212');

		this.sunGroup = new Group();
		this.pseudoSunGroup = new Group();
		this.sun = new Sun();
		this.add(this.sun);
		this.sun.position.set(10, 0, 0);
		this.sunGroup.position.set(0, 0, 0);
		this.pseudoSunGroup.position.set(10, 0, 0);
		this.sunGroup.add(this.pseudoSunGroup);
		this.sun.directionalLight.target = this.sunGroup;
		this.add(this.sunGroup);

		// soft white light
		// this.light = new THREE.AmbientLight(0x002020);
		// this.light.position.z = 100;
		// this.light.intensity = 0;
		// this.add(this.light);
		// this.fog = new THREE.Fog(0x2040aa, 2, 100);
	}
}

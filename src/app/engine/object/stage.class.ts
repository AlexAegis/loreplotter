import { Point } from './point.class';
import { EngineService } from '../engine.service';
import { throttleTime } from 'rxjs/operators';
import { Subject, BehaviorSubject } from 'rxjs';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { Vector3, Vector2 } from 'three';
import { Axis } from '../helper/axis.class';

export class Stage extends THREE.Scene {
	public camera: THREE.OrthographicCamera;
	private light: THREE.AmbientLight;

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

		// soft white light
		this.light = new THREE.AmbientLight(0x404040);
		this.light.position.z = 10;
		this.add(this.light);
		this.fog = new THREE.Fog(0x2040aa, 2, 100);
	}
}

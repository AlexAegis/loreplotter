import { Point } from './point.class';
import { EngineService } from '../engine.service';
import { throttleTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';

export class Stage extends THREE.Scene {
	public camera: THREE.PerspectiveCamera;
	private light: THREE.AmbientLight;

	zoomTargetSubj: Subject<number> = new Subject();
	minZoom = 2;
	maxZoom = 20;

	constructor(public engineService: EngineService) {
		super();
		this.name = 'stage';
		this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.name = 'camera';
		this.camera.position.z = 6;
		this.add(this.camera);

		// soft white light
		this.light = new THREE.AmbientLight(0x404040);
		this.light.position.z = 6;
		this.add(this.light);
		this.fog = new THREE.Fog(0x2040aa, 2, 100);

		let tw: TWEEN.Tween;
		this.zoomTargetSubj
			.asObservable()
			.pipe(throttleTime(100))
			.subscribe(target => {
				if (tw) {
					tw.stop();
				}
				tw = new TWEEN.Tween(this.camera.position)
					.to({ z: target }, 100)
					.easing(TWEEN.Easing.Linear.None)
					.onUpdate(o => {
						if (this.camera.position.z === NaN) {
							this.camera.position.z = this.minZoom;
						}
						this.camera.updateProjectionMatrix();
					})
					.start(Date.now());
			});
	}

	zoom(amount: number) {
		const norm = amount / Math.abs(amount);
		this.zoomTargetSubj.next(THREE.Math.clamp(this.camera.position.z - norm, this.minZoom, this.maxZoom));
	}
}

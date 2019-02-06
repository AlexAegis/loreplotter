import { globeShader } from './shader/globe.shader';
import { Injectable } from '@angular/core';
import { Vector3, Euler, Quaternion } from 'three';
import { Subject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { Globe } from './object/globe.class';
import { denormalize } from './helper/denormalize.function';
import { Point } from './object/point.class';
import { PopupComponent } from '../component/popup/popup.component';

@Injectable({
	providedIn: 'root'
})
export class EngineService {
	private renderer: THREE.WebGLRenderer;
	public camera: THREE.PerspectiveCamera;
	public scene: THREE.Scene;
	private light: THREE.AmbientLight;
	private raycaster: THREE.Raycaster = new THREE.Raycaster();
	public globe: Globe;
	public indicator: PopupComponent;

	minZoom = 2;
	maxZoom = 20;

	public center = new Vector3(0, 0, 0);

	zoomTargetSubj: Subject<number> = new Subject();

	constructor() {}

	createScene(canvas: HTMLCanvasElement): void {
		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: true,
			antialias: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.scene = new THREE.Scene();
		this.scene.name = 'scene';
		this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.name = 'camera';
		this.camera.position.z = 6;
		this.scene.add(this.camera);

		// soft white light
		this.light = new THREE.AmbientLight(0x404040);
		this.light.position.z = 6;
		this.scene.add(this.light);
		this.scene.fog = new THREE.Fog(0x2040aa, 2, 100);

		this.globe = new Globe(this.camera);
		// this.globe.engineStore = this.engineStore;
		this.scene.add(this.globe);
		/*const axesHelper = new THREE.AxesHelper(5);
		this.scene.add(axesHelper);*/

		let tw: TWEEN.Tween;
		this.zoomTargetSubj
			.asObservable()
			.pipe(throttleTime(100))
			.subscribe(target => {
				if (tw) {
					tw.stop();
				}
				tw = new TWEEN.Tween(this.camera.position)
					.to({ z: target }, 160)
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

	click(coord: Vector3, shift: boolean) {
		this.raycaster.setFromCamera(coord, this.camera);

		this.raycaster
			.intersectObjects(this.globe.children)
			.splice(0, 1)
			.forEach(intersection => {
				intersection.object.dispatchEvent({ type: 'select', message: 'You have been clicked!' });
			});

		this.raycaster
			.intersectObject(this.globe, true)
			.splice(0, 1)
			.forEach(intersection => {
				if (shift) {
					intersection.object.dispatchEvent({ type: 'create', point: intersection.point });
				} else {
					intersection.object.dispatchEvent({ type: 'click', point: intersection.point });
				}
			});
	}

	hover(coord: Vector3) {
		this.raycaster.setFromCamera(coord, this.camera);
		this.raycaster
			.intersectObject(this.globe, true)
			.splice(0, 1)
			.forEach(intersection => {
				intersection.object.children.forEach(child => child.dispatchEvent({ type: 'unhover' }));
				if (intersection.object.type === 'Point') {
					intersection.object.dispatchEvent({ type: 'hover' });
				}
			});
	}

	animate(): void {
		window.addEventListener('DOMContentLoaded', () => {
			this.render();
		});

		window.addEventListener('resize', () => {
			this.resize();
		});
	}

	render() {
		requestAnimationFrame(() => this.render());
		TWEEN.update(Date.now());
		this.renderer.render(this.scene, this.camera);
	}

	resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.globe.changed();
	}
}

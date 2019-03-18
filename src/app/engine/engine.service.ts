import { Stage } from './object/stage.class';
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
import { Interactive } from './interfaces/interactive.interface';

@Injectable({
	providedIn: 'root'
})
export class EngineService {
	private renderer: THREE.WebGLRenderer;

	public stage: Stage;

	private raycaster: THREE.Raycaster = new THREE.Raycaster();
	public globe: Globe;
	public indicator: PopupComponent;

	public center = new Vector3(0, 0, 0);

	public selected: Point;

	constructor() {}

	createScene(canvas: HTMLCanvasElement): void {
		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: true,
			antialias: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.stage = new Stage(this);
		const axesHelper = new THREE.AxesHelper(1.5);
		this.stage.add(axesHelper);

		this.globe = new Globe();
		this.stage.add(this.globe);
	}

	click(coord: Vector3, shift: boolean) {
		console.log('click');
		this.raycaster.setFromCamera(coord, this.stage.camera);

		this.raycaster
			.intersectObject(this.globe, true)
			.filter(intersection => intersection.object.name === 'globe' || intersection.object.name === 'point') // Ignoring arcs
			.splice(0, 1)
			.forEach(intersection => {
				console.log('intersect');
				// console.log(intersection.point);
				// console.log(intersection.object.name);
				// console.log(intersection.object);
				if (intersection.object.name === 'globe') {
					if (shift) {
						intersection.object.dispatchEvent({
							type: 'create',
							point: intersection.point
						});
					} else {
						intersection.object.dispatchEvent({ type: 'click', point: intersection.point });
					}
				} else if (intersection.object.name === 'point') {
					intersection.object.dispatchEvent({ type: 'select' });
				}
			});
	}

	hover(coord: Vector3) {
		this.raycaster.setFromCamera(coord, this.stage.camera);
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
		this.renderer.render(this.stage, this.stage.camera);
	}

	resize() {
		this.stage.camera.aspect = window.innerWidth / window.innerHeight;
		this.stage.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.globe.changed();
	}
}

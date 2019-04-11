import { Stage } from './object/stage.class';
import { Injectable } from '@angular/core';
import { Vector3 } from 'three';
import { BehaviorSubject, of, EMPTY, merge, NEVER } from 'rxjs';
import { switchMap, tap, share, finalize, distinctUntilChanged } from 'rxjs/operators';

import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { Globe } from './object/globe.class';
import { Point } from './object/point.class';
import { PopupComponent } from '../component/popup/popup.component';
import { Vector2 } from 'three';

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

	public selected: BehaviorSubject<Point> = new BehaviorSubject<Point>(undefined);

	public selection$ = this.selected.pipe(
		distinctUntilChanged(),
		switchMap(item => (!item ? EMPTY : merge(of(item), NEVER).pipe(finalize(() => item.deselect())))),
		tap(item => item.select()),
		tap(() => this.globe.changed()),
		share()
	);

	public hovered: BehaviorSubject<Point> = new BehaviorSubject<Point>(undefined);

	public hover$ = this.hovered.pipe(
		distinctUntilChanged(),
		switchMap(item => (!item ? EMPTY : merge(of(item), NEVER).pipe(finalize(() => item.unhover())))),
		tap(item => item.hover()),
		tap(() => this.globe.changed()),
		share()
	);

	/**
	 * These subscribtions are for ensuring the side effects are happening always, even when there are no other subscirbers to the listeners
	 * (Since they are shared, side effects will only happen once)
	 */
	constructor() {
		this.selection$.subscribe();
		this.hover$.subscribe();
	}

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

	spawnActor(coord: Vector2): void {
		this.raycaster.setFromCamera(coord, this.stage.camera);
		this.raycaster
			.intersectObject(this.globe, true)
			.filter(intersection => intersection.object.type === 'Globe' || intersection.object.type === 'Point') // Ignoring arcs
			.splice(0, 1)
			.forEach(intersection => {
				if (intersection.object.type === 'Globe') {
					intersection.object.dispatchEvent({
						type: 'create',
						point: intersection.point
					});
				} else if (intersection.object.type === 'Point') {
					intersection.object.dispatchEvent({ type: 'select' });
				}
			});
	}

	public intersection(normalizedPosition: Vector2): Vector3 {
		this.raycaster.setFromCamera(normalizedPosition, this.stage.camera);
		const intersection = this.raycaster.intersectObject(this.globe, true).filter(i => i.object.type === 'Globe')[0];
		return intersection && intersection.point;
	}

	click(coord: Vector2, shift: boolean) {
		this.raycaster.setFromCamera(coord, this.stage.camera);
		this.raycaster
			.intersectObject(this.globe, true)
			.filter(intersection => intersection.object.type === 'Globe' || intersection.object.type === 'Point') // Ignoring arcs
			.splice(0, 1) // only the first hit
			.forEach(intersection => {
				intersection.object.dispatchEvent({ type: 'click', point: intersection.point, shift: shift });
			});
	}

	putCurve(from: Vector3, to: Vector3): void {
		this.globe.putCurve(from, to);
	}

	hover(coord: Vector2) {
		this.raycaster.setFromCamera(coord, this.stage.camera);
		this.raycaster
			.intersectObject(this.globe, true)
			.splice(0, 1)
			.forEach(intersection => {
				intersection.object.dispatchEvent({ type: 'hover' });
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

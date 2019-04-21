import { Injectable } from '@angular/core';
import * as TWEEN from '@tweenjs/tween.js';
import { BehaviorSubject, EMPTY, merge, NEVER, of, interval } from 'rxjs';
import { distinctUntilChanged, finalize, share, switchMap, tap, take, delay, withLatestFrom } from 'rxjs/operators';
import { Vector2, Vector3, WebGLRenderer } from 'three';
import * as THREE from 'three';
import { OrbitControls } from 'three-full';

import { PopupComponent } from '../component/popup/popup.component';
import { DatabaseService } from './../database/database.service';
import { Globe } from './object/globe.class';
import { Point } from './object/point.class';
import { Stage } from './object/stage.class';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { Control } from './control/control.class';

// Injecting the three-mesh-bvh functions for significantly faster ray-casting
(THREE.BufferGeometry.prototype as { [k: string]: any }).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as { [k: string]: any }).disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
@Injectable({
	providedIn: 'root'
})
export class EngineService {
	/**
	 * These subscribtions are for ensuring the side effects are happening always, even when there are no other subscirbers to the listeners
	 * (Since they are shared, side effects will only happen once)
	 */
	constructor(private databaseService: DatabaseService) {
		this.selection$.subscribe();

		this.hover$.subscribe();
	}
	private renderer: THREE.WebGLRenderer;

	public stage: Stage;
	public controls: OrbitControls;

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

	public drag: BehaviorSubject<Point | Globe> = new BehaviorSubject<Point | Globe>(undefined);

	public spawnOnWorld$ = new BehaviorSubject<{ object: Point; point: Vector3 }>(undefined);

	public createScene(canvas: HTMLCanvasElement): void {
		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: false,
			antialias: true
		});
		this.renderer.gammaOutput = true;
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		this.stage = new Stage(this);
		this.stage.add(new THREE.AxesHelper(5));

		this.globe = new Globe(1);

		this.stage.add(this.globe);

		this.controls = new Control(this.stage.camera, this.renderer.domElement, this.globe);
		/*
		interval(1000 / 60)
			.pipe(
				withLatestFrom(of(this)),
				delay(2000),
				take(240)
			)
			.subscribe(([next, t]) => {
				let i = next / 240;
				i = 1 - i;
				i *= 99;
				i = Math.round(i);

				let n = next / 240;
				n *= 99;
				n = Math.round(i);
				// console.log('FUCK' + i + ' n: ' + n);
				// this.canvasContext.clearRect(0, 0, 100, 100);
				t.canvasContext.fillStyle = `#${i}${n}${n}`;
				t.canvasContext.fillRect(0, 0, 100, 50);

				t.canvasContext.fillStyle = `#${n}${i}${n}`;
				t.canvasContext.fillRect(0, 50, 100, 50);

				t.texture.image.src = t.engineCanvas.toDataURL();
				t.texture.anisotropy = 4;
				t.texture.needsUpdate = true;
				// console.log((this.globe.material as any).displacementMap === this.texture);
				// (this.globe.material as any).displacementMap.needsUpdate = true;
			});*/
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
				intersection.object.dispatchEvent({
					type: 'click',
					point: intersection.point,
					shift: shift
				});

				// Only send this event when the correct mode is active, also send the draw on pan too
				intersection.object.dispatchEvent({
					type: 'draw',
					point: intersection.point,
					shift: shift,
					uv: intersection.uv,
					face: intersection.face
				});
			});
	}

	public context(coord: Vector2) {
		this.raycaster.setFromCamera(coord, this.stage.camera);
		this.raycaster
			.intersectObject(this.globe, true)
			.filter(intersection => intersection.object.type === 'Globe' || intersection.object.type === 'Point') // Ignoring arcs
			.splice(0, 1) // only the first hit
			.forEach(intersection => {
				intersection.object.dispatchEvent({ type: 'context', point: intersection.point });
			});
	}

	public pan(coord: Vector2, velocity: Vector2, start: boolean, end: boolean) {
		this.raycaster.setFromCamera(coord, this.stage.camera);
		this.raycaster
			.intersectObject(this.globe, true)
			.filter(i => i.object.type === 'Globe' || i.object.type === 'Point') // Globe is needed so you can pan fast
			.splice(0, 1) // only the first hit
			.forEach(intersection => {
				if (start && intersection.object.type === 'Point') {
					this.drag.next(<Point>intersection.object);
					this.controls.enabled = false;
				}
				this.controls.enabled = false; // always disabled TODO TAKE THIS OUT
				if (this.drag.value !== undefined) {
					this.drag.value.dispatchEvent({
						type: 'pan',
						point: intersection.point,
						velocity: velocity,
						final: end
					});
				}
				if (intersection.object.type === 'Globe') {
					intersection.object.dispatchEvent({
						type: 'draw',
						point: intersection.point,
						uv: intersection.uv,
						face: intersection.face
					});
				}

				if (end) {
					if (intersection.object.type === 'Point') {
						this.spawnOnWorld$.next({ object: <Point>intersection.object, point: intersection.point });
					}
					this.drag.next(undefined);
					this.controls.enabled = true;
				}
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
		if (this.controls) {
			this.controls.update();
		}
		this.renderer.render(this.stage, this.stage.camera);
	}

	public resize() {
		this.stage.camera.left = window.innerWidth / -2;
		this.stage.camera.right = window.innerWidth / 2;
		this.stage.camera.top = window.innerHeight / 2;
		this.stage.camera.bottom = window.innerHeight / -2;
		this.stage.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.globe.changed();
	}
}

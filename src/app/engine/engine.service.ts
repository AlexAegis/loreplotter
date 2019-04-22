import { TextureDelta } from './../model/texture-delta.class';
import { ButtonType } from './control/button-type.class';
import { SceneControlService } from './../component/scene-controls/scene-control.service';
import { Injectable } from '@angular/core';
import * as TWEEN from '@tweenjs/tween.js';
import { BehaviorSubject, EMPTY, merge, NEVER, of, interval } from 'rxjs';
import { distinctUntilChanged, finalize, share, switchMap, tap, take, delay, withLatestFrom } from 'rxjs/operators';
import { Vector2, Vector3, WebGLRenderer } from 'three';
import * as THREE from 'three';
import { OrbitControls, ShaderGodRays } from 'three-full';

import { PopupComponent } from '../component/popup/popup.component';
import { DatabaseService } from './../database/database.service';
import { Globe } from './object/globe.class';
import { Point } from './object/point.class';
import { Stage } from './object/stage.class';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { Control } from './control/control.class';
import { Planet } from '../model/planet.class';

import {
	BlendFunction,
	EffectPass,
	GodRaysEffect,
	KernelSize,
	SMAAEffect,
	RenderPass,
	BloomEffect,
	EffectComposer
} from 'postprocessing';

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
	constructor(private databaseService: DatabaseService, public sceneControlService: SceneControlService) {
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

	public textureChange$: BehaviorSubject<string> = new BehaviorSubject<string>(undefined);

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

	public drag: BehaviorSubject<Point> = new BehaviorSubject<Point>(undefined);

	public spawnOnWorld$ = new BehaviorSubject<{ object: Point; point: Vector3 }>(undefined);

	public composer: EffectComposer;
	public renderPass: RenderPass;
	public godRays: GodRaysEffect;
	public bloomEffect: BloomEffect;
	public pass: EffectPass;

	public createScene(canvas: HTMLCanvasElement): void {
		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: false,
			logarithmicDepthBuffer: true,
			antialias: true
		});
		this.renderer.setPixelRatio(window.devicePixelRatio);
		// this.renderer.gammaOutput = true;
		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;
		this.renderer.setClearColor(0x000000, 0.0);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.shadowMap.enabled = true;
		this.stage = new Stage(this);
		// this.stage.add(new THREE.AxesHelper(5));
		this.globe = new Globe();
		this.stage.add(this.globe);
		this.controls = new Control(this.stage.camera, this.renderer.domElement, this.globe);

		// PostProcessing

		/*const smaaEffect = new SMAAEffect(assets.get("smaa-search"), assets.get("smaa-area"));
		smaaEffect.setEdgeDetectionThreshold(0.065);
*/

		this.composer = new EffectComposer(this.renderer, {
			stencilBuffer: true
		});
		this.renderPass = new RenderPass(this.stage, null);
		this.renderPass.camera = this.stage.camera;
		this.renderPass.renderToScreen = false;

		this.godRays = new GodRaysEffect(this.stage.camera, this.stage.sun, {
			resolutionScale: 0.75,
			blendFunction: BlendFunction.LIGHTEN,
			kernelSize: KernelSize.SMALL,
			density: 0.98,
			decay: 0.93,
			weight: 0.3,
			exposure: 0.55,
			samples: 60,
			clampMax: 1.0
		});

		this.bloomEffect = new BloomEffect({
			blendFunction: BlendFunction.SCREEN,
			kernelSize: KernelSize.SMALL,
			resolutionScale: 0.5,
			distinction: 1.0
		});

		this.bloomEffect.blendMode.opacity.value = 2.1;

		this.godRays.dithering = true;

		this.pass = new EffectPass(this.stage.camera, /*smaaEffect,*/ this.bloomEffect, this.godRays);
		this.pass.renderToScreen = true;

		this.composer.addPass(this.renderPass);
		this.composer.addPass(this.pass);
	}

	public createPlanet(planet: Planet): void {}

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
				if (!this.sceneControlService.isMoving()) {
					intersection.object.dispatchEvent({
						type: 'draw',
						point: intersection.point,
						shift: shift,
						uv: intersection.uv,
						face: intersection.face,
						mode: this.sceneControlService.activeMode.value,
						value: this.sceneControlService.valueSlider.value,
						size: this.sceneControlService.sizeSlider.value
					});
				}
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

	public pan(coord: Vector2, velocity: Vector2, button: number, start: boolean, end: boolean) {
		if (start && !this.sceneControlService.isMoving()) {
			this.controls.enabled = false;
		} else if (end) {
			this.controls.enabled = true;
		}

		this.raycaster.setFromCamera(coord, this.stage.camera);
		this.raycaster
			.intersectObject(this.globe, true)
			.filter(i => i.object.type === 'Globe' || i.object.type === 'Point') // Globe is needed so you can pan fast
			.splice(0, 1) // only the first hit
			.forEach(intersection => {
				if (start && intersection.object.type === 'Point') {
					this.drag.next(<Point>intersection.object);
				}
				if (this.sceneControlService.isMoving() || button === ButtonType.RIGHT) {
					if (this.drag.value !== undefined) {
						this.controls.enabled = false; // if its a point im dragging
						this.drag.value.dispatchEvent({
							type: 'pan',
							point: intersection.point,
							velocity: velocity,
							final: end
						});
					}
				}

				if (!this.sceneControlService.isMoving()) {
					this.controls.enabled = false;
					if (intersection.object.type === 'Globe') {
						intersection.object.dispatchEvent({
							type: 'draw',
							point: intersection.point,
							uv: intersection.uv,
							face: intersection.face,
							mode: this.sceneControlService.activeMode.value,
							value: this.sceneControlService.valueSlider.value,
							size: this.sceneControlService.sizeSlider.value,
							final: end
						});
					}
				}

				if (end) {
					if (this.drag.value !== undefined) {
						this.spawnOnWorld$.next({ object: this.drag.value, point: intersection.point });
					}
					/*if (intersection.object.type === 'Point') {
					}*/

					this.drag.next(undefined);
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
		this.composer.render();
		// this.renderer.render(this.stage, this.stage.camera);
	}

	public resize() {
		/*	this.stage.camera.left = window.innerWidth / -2;
		this.stage.camera.right = window.innerWidth / 2;
		this.stage.camera.top = window.innerHeight / 2;
		this.stage.camera.bottom = window.innerHeight / -2;*/
		this.stage.camera.aspect = window.innerWidth / window.innerHeight;
		this.stage.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.globe.changed();
	}
}

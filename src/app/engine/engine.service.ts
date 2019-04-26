import { DynamicTexture } from './object/dynamic-texture.class';
import { atmosphereShader } from './shader/atmosphere.shader';
import { Atmosphere } from './object/atmosphere.class';
import { TextureDelta } from './../model/texture-delta.class';
import { ButtonType } from './control/button-type.class';
import { SceneControlService } from './../component/scene-controls/scene-control.service';
import { Injectable } from '@angular/core';
import * as TWEEN from '@tweenjs/tween.js';
import { BehaviorSubject, EMPTY, merge, NEVER, of, interval, ReplaySubject } from 'rxjs';
import { distinctUntilChanged, finalize, share, switchMap, tap } from 'rxjs/operators';
import { Vector2, Vector3, WebGLRenderer, Clock } from 'three';
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
	VignetteEffect,
	ToneMappingEffect,
	OutlineEffect,
	EffectComposer
} from 'postprocessing';
import * as dat from 'dat.gui';
import { withTeardown } from '../misc/with-teardown.function';
import { DeviceDetectorService } from 'ngx-device-detector';

// Injecting the three-mesh-bvh functions for significantly faster ray-casting
(THREE.BufferGeometry.prototype as { [k: string]: any }).computeBoundsTree = computeBoundsTree;
(THREE.BufferGeometry.prototype as { [k: string]: any }).disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
@Injectable({
	providedIn: 'root'
})
export class EngineService {
	public clock: Clock;
	/**
	 * These subscribtions are for ensuring the side effects are happening always, even when there are no other subscirbers to the listeners
	 * (Since they are shared, side effects will only happen once)
	 */
	constructor(
		private databaseService: DatabaseService,
		public sceneControlService: SceneControlService,
		private deviceService: DeviceDetectorService
	) {
		this.clock = new Clock();
		this.selection$.subscribe();
		this.hover$.subscribe();
	}
	private renderer: THREE.WebGLRenderer;

	public stage: Stage;
	public controls: OrbitControls;

	public raycaster: THREE.Raycaster = new THREE.Raycaster();
	public globe: Globe;
	public indicator: PopupComponent;

	public center = new Vector3(0, 0, 0);

	public textureChange$: ReplaySubject<DynamicTexture> = new ReplaySubject<DynamicTexture>(1);

	public selected: BehaviorSubject<Point> = new BehaviorSubject<Point>(undefined);

	public selection$ = this.selected.pipe(
		distinctUntilChanged(),
		withTeardown(
			item => this.selectOutlineEffect.setSelection([item]),
			item => () => this.selectOutlineEffect.deselectObject(item)
		),
		tap(() => this.globe.changed()),
		share()
	);

	public hovered: BehaviorSubject<Point> = new BehaviorSubject<Point>(undefined);

	public hover$ = this.hovered.pipe(
		distinctUntilChanged(),
		withTeardown(
			item => this.hoverOutlineEffect.setSelection([item]),
			item => () => this.hoverOutlineEffect.deselectObject(item)
		),
		tap(() => this.globe.changed()),
		share()
	);

	public drag: Point = undefined;

	public spawnOnWorld$ = new BehaviorSubject<{ point: Point; position: Vector3 }>(undefined);

	public composer: EffectComposer;
	public renderPass: RenderPass;
	public godRays: GodRaysEffect;
	public bloomEffect: BloomEffect;
	public vignetteEffect: VignetteEffect;
	public toneMappingEffect: ToneMappingEffect;
	public hoverOutlineEffect: OutlineEffect;
	public selectOutlineEffect: OutlineEffect;
	public pass: EffectPass;

	public atmosphere: Atmosphere;

	private postprocessing: boolean;

	public createScene(canvas: HTMLCanvasElement): void {
		const isDesktopDevice = this.deviceService.isDesktop();

		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: false,
			logarithmicDepthBuffer: true,
			antialias: false
		});
		let downScaleFactor: number;
		if (isDesktopDevice) {
			downScaleFactor = 1; // No downscale
		} else {
			downScaleFactor = 2;
		}
		this.renderer.setPixelRatio(window.devicePixelRatio / downScaleFactor);
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

		const glowMaterial = new THREE.ShaderMaterial({
			uniforms: {
				c: { type: 'f', value: 0.5 },
				p: { type: 'f', value: 12 },
				glowColor: { type: 'c', value: new THREE.Color('#2f91ff') },
				viewVector: { type: 'v3', value: this.stage.camera.position }
			},
			vertexShader: atmosphereShader.vertexShader,
			fragmentShader: atmosphereShader.fragmentShader,
			side: THREE.BackSide,
			blending: THREE.AdditiveBlending,
			transparent: false
		});

		const glow = new THREE.Mesh(new THREE.SphereBufferGeometry(this.globe.radius, 60, 60), glowMaterial);

		glow.scale.multiplyScalar(1.04);
		this.stage.add(glow);

		// PostProcessing

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
			decay: 0.94,
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

		this.vignetteEffect = new VignetteEffect({
			eskil: true,
			offset: 0.05,
			darkness: 0.7
		});
		// Cant make it work
		this.toneMappingEffect = new ToneMappingEffect({
			blendFunction: BlendFunction.NORMAL,
			resolution: 8,
			adaptive: true,
			distinction: 3.7,
			adaptationRate: 5.0,
			averageLuminance: 1,
			maxLuminance: 10.0,
			middleGrey: 0.22
		});

		this.hoverOutlineEffect = new OutlineEffect(this.stage, this.stage.camera, {
			blendFunction: BlendFunction.SCREEN,
			edgeStrength: 9,
			pulseSpeed: 0.0,
			visibleEdgeColor: 0x38ff70,
			hiddenEdgeColor: 0x30bf40,
			blur: 4,
			blurriness: 4,
			xRay: true
		});
		this.selectOutlineEffect = new OutlineEffect(this.stage, this.stage.camera, {
			blendFunction: BlendFunction.ADD,
			edgeStrength: 2.5,
			pulseSpeed: 0.0,
			visibleEdgeColor: 0xffff00,
			hiddenEdgeColor: 0x22090a,
			blur: false,
			xRay: true
		});

		/*
adaptive: true,
			resolution: 256,
			distinction: 2.0,
			middleGrey: 0.6,
			maxLuminance: 16.0,
			averageLuminance: 1.0,
			adaptationRate: 5.0

		*/

		this.bloomEffect.blendMode.opacity.value = 3.1;

		this.godRays.dithering = true;

		this.pass = new EffectPass(
			this.stage.camera,
			this.godRays,
			/*smaaEffect,*/
			this.bloomEffect,
			// 	this.toneMappingEffect,
			this.hoverOutlineEffect,
			this.selectOutlineEffect,
			this.vignetteEffect
		);
		this.pass.renderToScreen = true;

		this.composer.addPass(this.renderPass);
		this.composer.addPass(this.pass);
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

	public click(coord: Vector2, shift: boolean) {
		this.raycaster.setFromCamera(coord, this.stage.camera);
		const intersection = this.raycaster
			.intersectObject(this.globe, true)
			.filter(i => i.object.type === 'Globe' || i.object.type === 'Point') // Ignoring arcs
			.shift(); // only the first hit
		if (intersection) {
			console.log('CLICK: ' + intersection.object.type);
			intersection.object.dispatchEvent({
				type: 'click',
				point: intersection.point,
				shift: shift
			});
			if (this.sceneControlService.isDraw()) {
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
			} else {
				if (intersection.object.type === 'Point') {
					this.selected.next(intersection.object as Point);
				} else {
					this.selected.next(undefined);
				}
			}
		}
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
		this.controls.enabled = this.sceneControlService.isMoving();
		this.raycaster.setFromCamera(coord, this.stage.camera);
		const intersections = this.raycaster.intersectObject(this.globe, true);
		const intersectionsFiltered = intersections.filter(i => i.object.type === 'Globe' || i.object.type === 'Point'); // Ignoring arcs
		const intersection = intersectionsFiltered[0]; // only the first hit
		if (intersection) {
			if (start) {
				switch (intersection.object.type) {
					case 'Point':
						this.drag = <Point>intersection.object;
						this.controls.enabled = false;
						break;
					case 'Globe':
						this.drag = undefined;
						this.controls.enabled = false;
						break;
				}
			}

			if (this.drag !== undefined) {
				this.controls.enabled = false; // if its a point im dragging
				this.drag.dispatchEvent({
					type: 'pan',
					point: intersection.point,
					velocity: velocity,
					final: end
				});
			}

			if (this.sceneControlService.isDraw()) {
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

			if (end) {
				if (this.drag !== undefined) {
					this.spawnOnWorld$.next({ point: this.drag, position: intersection.point });
					this.drag = undefined;
				}
				/*if (intersection.object.type === 'Point') {
					}*/
				// this.controls.enabled = true;
			}
		}
	}

	putCurve(from: Vector3, to: Vector3): void {
		this.globe.putCurve(from, to);
	}

	public hover(coord: Vector2) {
		this.raycaster.setFromCamera(coord, this.stage.camera);
		const intersection = this.raycaster.intersectObject(this.globe, true).shift();

		if (intersection && intersection.object.type === 'Point') {
			this.hovered.next(intersection.object as Point);
		} else {
			this.hovered.next(undefined);
		}
	}

	/**
	 * Start the rendering process
	 */
	public animate(): void {
		if (this.renderer.context.getSupportedExtensions().indexOf('EXT_frag_depth') >= 0) {
			this.postprocessing = true;
		} else {
			this.postprocessing = false; // TODO: duh
		}

		window.addEventListener('DOMContentLoaded', () => {
			this.render();
		});

		window.addEventListener('resize', () => {
			this.resize();
		});
	}

	/**
	 * Main render loop
	 */
	private render() {
		requestAnimationFrame(() => this.render());
		TWEEN.update(Date.now());
		if (this.controls) {
			this.controls.update();
		}
		if (this.postprocessing) {
			this.composer.render(this.clock.getDelta());
		} else {
			this.renderer.render(this.stage, this.stage.camera);
		}
	}

	/**
	 * Adjust camera and renderer on resize
	 */
	public resize() {
		this.stage.camera.aspect = window.innerWidth / window.innerHeight;
		this.stage.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.composer.setSize(window.innerWidth, window.innerHeight);
		this.globe.changed();
	}
}

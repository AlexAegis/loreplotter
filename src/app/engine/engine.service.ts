import { Injectable } from '@angular/core';
import * as TWEEN from '@tweenjs/tween.js';
import { DeviceDetectorService } from 'ngx-device-detector';
import {
	BlendFunction,
	BloomEffect,
	EffectComposer,
	EffectPass,
	GodRaysEffect,
	KernelSize,
	OutlineEffect,
	RenderPass,
	ToneMappingEffect,
	VignetteEffect
} from 'postprocessing';
import { RxDocument } from 'rxdb';
import { BehaviorSubject, combineLatest, from, merge, ReplaySubject, range, zip, timer, Subject } from 'rxjs';
import { distinctUntilChanged, map, share, tap, shareReplay, filter, auditTime, flatMap, take } from 'rxjs/operators';
import * as THREE from 'three';
import { Clock, Color, Raycaster, Vector2, Vector3, WebGLRenderer } from 'three';
import { OrbitControls } from 'three-full';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

import { PopupComponent } from '../component/popup/popup.component';
import { tweenMap } from '../misc/tween-map.operator';
import { withTeardown } from '../misc/with-teardown.operator';
import { Actor } from '../model/actor.class';
import { SceneControlService } from './../component/scene-controls/scene-control.service';
import { Control } from './control/control.class';
import { denormalize } from './helper/denormalize.function';
import { DynamicTexture } from './object/dynamic-texture.class';
import { Globe } from './object/globe.class';
import { Point } from './object/point.class';
import { Stage } from './object/stage.class';
import { atmosphereShader } from './shader/atmosphere.shader';

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
	constructor(public sceneControlService: SceneControlService, private deviceService: DeviceDetectorService) {
		this.selection$.subscribe();
		this.hover$.subscribe();
	}
	// Rendering
	public clock = new Clock(); // Clock for the renderer
	private renderer: WebGLRenderer;
	public raycaster = new Raycaster();

	// Postprocessing
	public composer: EffectComposer;
	public renderPass: RenderPass;
	public godRays: GodRaysEffect;
	public bloomEffect: BloomEffect;
	public vignetteEffect: VignetteEffect;
	public toneMappingEffect: ToneMappingEffect;
	public hoverOutlineEffect: OutlineEffect;
	public selectOutlineEffect: OutlineEffect;
	public pass: EffectPass;

	// 3D Objects
	public stage: Stage;
	public control: Control;
	public globe: Globe;

	// Playback
	public speed = new BehaviorSubject<number>(3600 / 6); // Current speed of the playback in seconds

	// Selection
	public popupTarget = new BehaviorSubject<Vector2>(null);
	public indicator: PopupComponent;
	public refreshPopupPositionQueue = new BehaviorSubject<boolean>(undefined);
	public refreshPopupPositionExecutor = this.refreshPopupPositionQueue
		.pipe(
			auditTime(1000 / 60),
			flatMap(next => zip(range(10), timer(0, 1000 / 60)).pipe(take(5)))
		)
		.subscribe(next => this.refreshPopupPosition());

	public selectedByActor = new BehaviorSubject<RxDocument<Actor>>(undefined); // Selected Actor on the sidebar
	public selected = new BehaviorSubject<Point>(undefined); // Selected Actor on map, and it's current position
	public selectedActorForwarder = this.selectedByActor
		.pipe(
			filter(actor => !!this.globe),
			map(actor => this.globe.findPointByActor(actor))
		)
		.subscribe(next => this.selected.next(next));

	public selection$ = this.selected.pipe(
		distinctUntilChanged(),
		tap(next => console.log('Selection changed!' + next)),
		withTeardown(
			item => this.selectOutlineEffect.setSelection([item]),
			item => () => this.selectOutlineEffect.deselectObject(item) // clearSelection() // deselectObject(item)
		),
		tap(() => this.refreshPopupPosition()),
		share()
	);

	// Hover
	public hovered = new Subject<Point>();
	public hover$ = this.hovered.pipe(
		distinctUntilChanged(),
		tap(next => console.log('Hovered changed!' + next)),
		withTeardown(
			item => this.hoverOutlineEffect.setSelection([item]),
			item => () => this.hoverOutlineEffect.deselectObject(item) // clearSelection() // deselectObject(item)
		),
		share()
	);

	// Zoom
	public zoomSubject: BehaviorSubject<number> = new BehaviorSubject<number>(undefined);

	// Drag
	public drag: Point = undefined;
	public spawnOnWorld = new BehaviorSubject<{ point: Point; position: Vector3 }>(undefined);

	// Draw
	public textureChange$ = new ReplaySubject<DynamicTexture>(1);

	// Light Control
	public manualLightControl = new BehaviorSubject<boolean>(false);
	public manualLight = new BehaviorSubject<boolean>(true);
	public autoLight$ = combineLatest([this.zoomSubject, this.speed]).pipe(
		map(([zoom, speed]) => zoom <= 0.4 || Math.abs(speed) >= 2000),
		distinctUntilChanged()
	);

	private darkToLight = { from: { light: 0 }, to: { light: 1 } };
	private lightToDark = { from: { light: 1 }, to: { light: 0 } };

	public light$ = combineLatest([this.manualLightControl, this.manualLight, this.autoLight$]).pipe(
		map(([manual, permaDay, auto]) => (manual ? permaDay : auto)),
		map(next => (next ? this.darkToLight : this.lightToDark)),
		tweenMap(1000, TWEEN.Easing.Exponential.Out),
		share()
	);

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
		this.globe = new Globe(this.zoomSubject);
		this.stage.add(this.globe);
		this.control = new Control(this, this.stage.camera, this.renderer.domElement);

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
		glow.scale.setScalar(1.04);
		this.stage.add(glow);
		this.initializePostprocessing();

		// Light and Dark mode change on the scene, for the UI, check subscriber in the AppComponent
		this.light$.subscribe(({ light }) => {
			(this.stage.background as Color).setScalar(light * 0.65 + 0.05);
			glow.scale.setScalar(light * 0.65 + 0.05);
			this.stage.ambient.intensity = light;
			this.stage.sun.material.opacity = 1 - light;
			this.stage.sun.directionalLight.intensity =
				(1 - light) * (this.stage.sun.directionalLightBaseIntensity - 0.05) + 0.05;
		});
	}

	private initializePostprocessing(): void {
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
			blendFunction: BlendFunction.SCREEN,
			edgeStrength: 9,
			pulseSpeed: 0.0,
			visibleEdgeColor: 0xffff00,
			hiddenEdgeColor: 0x22090a,
			blur: false,
			xRay: true
		});

		this.bloomEffect.blendMode.opacity.value = 3.1;

		this.godRays.dithering = true;

		this.pass = new EffectPass(
			this.stage.camera,
			this.godRays,
			/*smaaEffect,*/
			this.bloomEffect,
			// 	this.toneMappingEffect,
			// this.hoverOutlineEffect,
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
		this.control.enabled = this.sceneControlService.isMoving();
		this.raycaster.setFromCamera(coord, this.stage.camera);
		const intersections = this.raycaster.intersectObject(this.globe, true);
		const intersectionsFiltered = intersections.filter(i => i.object.type === 'Globe' || i.object.type === 'Point'); // Ignoring arcs
		const intersection = intersectionsFiltered[0]; // only the first hit
		if (intersection) {
			if (start) {
				switch (intersection.object.type) {
					case 'Point':
						this.drag = <Point>intersection.object;
						this.control.enabled = false;
						break;
					case 'Globe':
						this.drag = undefined;
						this.control.enabled = false;
						break;
				}
			}

			if (this.drag !== undefined) {
				this.control.enabled = false; // if its a point im dragging
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
					this.spawnOnWorld.next({ point: this.drag, position: intersection.point });
					this.drag = undefined;
				}
				/*if (intersection.object.type === 'Point') {
					}*/
				// this.controls.enabled = true;
			}
		}
	}

	putCurve(_from: Vector3, _to: Vector3): void {
		this.globe.putCurve(_from, _to);
	}

	public hover(coord: Vector2) {
		this.raycaster.setFromCamera(coord, this.stage.camera);
		const intersection = this.raycaster.intersectObject(this.globe, true).shift();

		if (intersection && intersection.object.type === 'Point') {
			console.log(intersection);
			this.hovered.next(intersection.object as Point);
		} else {
			this.hovered.next(undefined);
		}
	}

	/**
	 * Start the rendering process
	 */
	public animate(): void {
		// this.renderer.context.getSupportedExtensions().indexOf('EXT_frag_depth') >= 0 // Checking feature availability
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
		if (this.control) {
			this.control.update();
		}
		this.composer.render(this.clock.getDelta());
	}

	/**
	 * Adjust camera and renderer on resize
	 */
	private resize() {
		this.stage.camera.aspect = window.innerWidth / window.innerHeight;
		this.stage.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.composer.setSize(window.innerWidth, window.innerHeight);
		this.refreshPopupPosition();
	}

	public refreshPopupPosition() {
		const point: Point = this.selected.value;
		if (point) {
			this.popupTarget.next(denormalize(point.getWorldPosition(new Vector3()).project(this.stage.camera)));
		} else {
			this.popupTarget.next(undefined);
		}
	}
}

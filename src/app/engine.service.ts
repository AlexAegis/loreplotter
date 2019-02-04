import { globeShader } from './shader/globe.shader';
import * as THREE from 'three';
import { Injectable } from '@angular/core';
import { Vector3, Euler, Matrix4, Quaternion } from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { Subject, BehaviorSubject, ReplaySubject } from 'rxjs';
import { debounce, debounceTime, throttleTime } from 'rxjs/operators';
@Injectable({
	providedIn: 'root'
})
export class EngineService {
	private renderer: THREE.WebGLRenderer;
	private camera: THREE.PerspectiveCamera;
	private scene: THREE.Scene;
	private light: THREE.AmbientLight;

	private sphere: THREE.Mesh;
	private rotationEase: TWEEN.Tween;
	public from: any;
	public to: any;

	private radius = 1.5;

	minZoom = 2;
	maxZoom = 20;

	zoomTargetSubj: Subject<number> = new Subject();

	createScene(canvas: HTMLCanvasElement): void {
		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: true,
			antialias: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		// create the scene
		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.position.z = 10;
		this.scene.add(this.camera);
		this.camera.matrixAutoUpdate = true;
		// soft white light
		this.light = new THREE.AmbientLight(0x404040);
		this.light.position.z = 6;
		this.scene.add(this.light);
		this.scene.fog = new THREE.Fog(0x2040aa, 2, 100);

		const geometry = new THREE.SphereGeometry(this.radius, 100, 100);

		const material = new THREE.ShaderMaterial({
			uniforms: globeShader.uniforms,
			vertexShader: globeShader.vertexShader,
			fragmentShader: globeShader.fragmentShader
		});

		this.sphere = new THREE.Mesh(geometry, material);
		this.scene.add(this.sphere);

		/*const axesHelper = new THREE.AxesHelper(5);
		this.scene.add(axesHelper);*/

		let tw;
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
		let norm = amount / Math.abs(amount);
		this.zoomTargetSubj.next(THREE.Math.clamp(this.camera.position.z - norm, this.minZoom, this.maxZoom));
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
		let width = window.innerWidth;
		let height = window.innerHeight;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();

		this.renderer.setSize(width, height);
	}

	rotate(x: number, y: number, isFinal?: boolean): Euler {
		if (this.rotationEase) {
			this.rotationEase.stop();
		}
		this.sphere.rotateOnAxis(new Vector3(0, 1, 0), THREE.Math.DEG2RAD * x);
		this.sphere.rotateOnWorldAxis(new Vector3(1, 0, 0), THREE.Math.DEG2RAD * y);

		if (THREE.Math.RAD2DEG * this.sphere.rotation.z < 90 && THREE.Math.RAD2DEG * this.sphere.rotation.z > -90) {
			this.sphere.rotation.x = THREE.Math.clamp(
				this.sphere.rotation.x,
				THREE.Math.DEG2RAD * -90,
				THREE.Math.DEG2RAD * 90
			);
		} else {
			if (this.sphere.rotation.x > 0) {
				this.sphere.rotation.x = Math.max(this.sphere.rotation.x, THREE.Math.DEG2RAD * 90);
			} else {
				this.sphere.rotation.x = Math.min(this.sphere.rotation.x, THREE.Math.DEG2RAD * -90);
			}
		}

		if (isFinal) {
			this.rotationEase = this.rotatween(x * 3, y * 3);
		}

		return this.sphere.rotation;
	}

	rotatween(x: number, y: number) {
		let fromQuat = new Quaternion().copy(this.sphere.quaternion);

		let to = this.rotate(x, y);
		let toQuat = new Quaternion().copy(this.sphere.quaternion);
		this.sphere.setRotationFromQuaternion(fromQuat);

		let val = { v: 0 };
		let target = { v: 1 };
		return new TWEEN.Tween(val)
			.to(target, 1200)
			.easing(TWEEN.Easing.Elastic.Out)
			.onUpdate(o => {
				Quaternion.slerp(fromQuat, toQuat, this.sphere.quaternion, o.v);
			})
			.start(Date.now());
	}

	turnAngleOnX(angle: number) {
		let fromQuat = new Quaternion().copy(this.sphere.quaternion);
		this.sphere.rotateOnAxis(new Vector3(0, 1, 0), THREE.Math.DEG2RAD * angle);

		let toQuat = new Quaternion().copy(this.sphere.quaternion);
		this.sphere.rotateOnAxis(new Vector3(0, 1, 0), -THREE.Math.DEG2RAD * angle);

		let val = { v: 0 };
		let target = { v: 1 };
		new TWEEN.Tween(val)
			.to(target, 1200)
			.easing(TWEEN.Easing.Exponential.Out)
			.onUpdate(o => {
				Quaternion.slerp(fromQuat, toQuat, this.sphere.quaternion, o.v);
			})
			.start(Date.now());
	}
}

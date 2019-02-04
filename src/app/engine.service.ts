import { globeShader } from './shader/globe.shader';
import * as THREE from 'three';
import { Injectable } from '@angular/core';
import { Vector3, Euler, Matrix4, Quaternion } from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import { Subject } from 'rxjs';
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

	public throttledLogger: Subject<string> = new Subject();

	private radius = 1.5;

	createScene(canvas: HTMLCanvasElement): void {
		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: true,
			antialias: true
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		// create the scene
		this.scene = new THREE.Scene();

		this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.position.z = 6;
		this.scene.add(this.camera);

		// soft white light
		this.light = new THREE.AmbientLight(0x404040);
		this.light.position.z = 6;
		this.scene.add(this.light);
		this.scene.fog = new THREE.Fog(0x2040aa, 2, 100);

		const geometry = new THREE.SphereGeometry(this.radius, 100, 100);
		// let material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

		const material = new THREE.ShaderMaterial({
			uniforms: globeShader.uniforms,
			vertexShader: globeShader.vertexShader,
			fragmentShader: globeShader.fragmentShader
		});

		this.sphere = new THREE.Mesh(geometry, material);
		this.scene.add(this.sphere);

		const axesHelper = new THREE.AxesHelper(5);
		this.scene.add(axesHelper);

		this.throttledLogger
			.asObservable()
			.pipe(throttleTime(200))
			.subscribe(s => console.log(s));
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

		let logt: string = `x: ${THREE.Math.RAD2DEG * this.sphere.rotation.x} y: ${THREE.Math.RAD2DEG *
			this.sphere.rotation.y} z: ${THREE.Math.RAD2DEG * this.sphere.rotation.z}`;

		/*
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
		}*/

		if (isFinal) {
			this.rotatween(x, y);
		}

		this.throttledLogger.next(logt);
		return this.sphere.rotation;
	}

	angle: any = {
		value: 0
	};
	angleEnd: any = {
		value: 0
	};
	lookAt = new THREE.Vector3();
	rotatween(x: number, y: number) {
		let from = this.sphere.rotation;

		let fromVec = from.toVector3();
		let fromQuat = new Quaternion().setFromEuler(from);
		console.log(
			`from x: ${THREE.Math.RAD2DEG * from.x} y: ${THREE.Math.RAD2DEG * from.y} z: ${THREE.Math.RAD2DEG * from.z}`
		);

		let to = this.rotate(x * 10, y * 10);
		let toVec = to.toVector3();
		let toQuat = new Quaternion().setFromEuler(to);

		let sphericalStart = new THREE.Spherical().setFromVector3(fromVec);
		let sphericalEnd = new THREE.Spherical().setFromVector3(toVec);
		let vectorStart = new THREE.Vector3().setFromSpherical(sphericalStart);
		let vectorEnd = new THREE.Vector3().setFromSpherical(sphericalEnd);

		let normal = new THREE.Vector3()
			.copy(vectorStart)
			.cross(vectorEnd)
			.normalize();

		this.angle.value = 0;
		this.angleEnd.value = vectorStart.angleTo(vectorEnd);

		console.log(
			`to x: ${THREE.Math.RAD2DEG * to.x} y: ${THREE.Math.RAD2DEG * to.y} z: ${THREE.Math.RAD2DEG * to.z}`
		);

		let q = new THREE.Quaternion().setFromUnitVectors(fromVec.normalize(), toVec.normalize());

		this.rotate(-x * 10, -y * 10);
		return new TWEEN.Tween(fromQuat)
			.to(q, 1200)
			.easing(TWEEN.Easing.Exponential.Out)
			.onUpdate(o => {
				this.sphere.rotation.setFromQuaternion(o);
			}) // this.rotate(x / 10, y / 10)
			.start(Date.now());
	}

	/*
Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];

Euler.DefaultOrder = 'XYZ';
*/
	turnAngleOnX(angle: number) {
		let fromVec = this.sphere.rotation.toVector3();
		let fromEul = new THREE.Euler().copy(this.sphere.rotation).reorder('YXZ');
		let fromQuat = new Quaternion().copy(this.sphere.quaternion); //new Quaternion().setFromEuler(this.sphere.rotation);
		this.sphere.rotateOnAxis(new Vector3(0, 1, 0), THREE.Math.DEG2RAD * angle);
		let toVec = this.sphere.rotation.toVector3();
		let toEul = new THREE.Euler().copy(this.sphere.rotation).reorder('YXZ');
		let toQuat = new Quaternion().copy(this.sphere.quaternion); //new Quaternion().setFromEuler(this.sphere.rotation);
		this.sphere.rotateOnAxis(new Vector3(0, 1, 0), -THREE.Math.DEG2RAD * angle);
		console.log('turn');
		// o.x, o.y, o.z

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

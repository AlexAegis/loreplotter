import { ClickEvent } from './../event/click-event.type';
import { Point } from './point.class';
import { Shader, Vector3, Quaternion, Euler, Spherical } from 'three';
import { globeShader } from '../shader/globe.shader';

import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { interval, timer } from 'rxjs';
import { take, delay } from 'rxjs/operators';
import { Interactive } from '../interfaces/interactive.interface';
import { invert } from '../helper/invert.function';
import { EventEmitter, Output } from '@angular/core';
import { denormalize } from '../helper/denormalize.function';

export class Globe extends THREE.Mesh {
	private rotationEase: TWEEN.Tween;
	private center = new Vector3(0, 0, 0);
	@Output()
	rotationChange = new EventEmitter<Vector3>();

	constructor(private camera: THREE.Camera, private radius: number = 1.5, shader: Shader = globeShader) {
		super(
			new THREE.SphereGeometry(radius, 100, 100),
			new THREE.ShaderMaterial({
				uniforms: shader.uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader
			})
		);
		this.geometry.computeBoundingSphere();
		this.addEventListener('click', (event: ClickEvent) => {
			console.log(`me got click! @${event.point.toArray()}`);
			if (this.userData['selected']) {
				(<Interactive>this.userData['selected']).deselect();
				this.userData['selected'] = undefined;
			}
		});

		this.addEventListener('create', (event: ClickEvent) => {
			console.log('create');

			this.put(new Point(), new Spherical().setFromVector3(event.point.applyEuler(invert(this.rotation))));
		});
		// playground
		const point = new Point();

		const sph = new Spherical().setFromVector3(new Vector3(0, 0, this.radius));

		this.put(point, sph);

		timer(100, 500)
			.pipe(take(0))
			.subscribe(i => {
				new TWEEN.Tween(sph)
					.to({ theta: sph.theta - THREE.Math.DEG2RAD * 10 }, 500)
					.easing(TWEEN.Easing.Exponential.InOut)
					.onUpdate(s => {
						point.position.setFromSpherical(s);

						point.lookAt(0, 0, 0);
					})
					.start(Date.now());
			});
	}

	/**
	 * Put an object onto the surface of the Globe
	 *
	 * @param object to be played on the globe
	 * @param position where it will be placed, not that the radius will be overriden and as such, is skippable
	 * @param height by default 0, bottom of the bounding box will touch the surface of the globe. This value will offset it
	 */
	put(object: THREE.Mesh, position: Spherical, height: number = 0): void {
		position.radius = this.radius + height + object.geometry.boundingBox.max.y;
		object.position.setFromSpherical(position);
		object.lookAt(this.position);
		this.add(object);
	}

	rotate(x: number, y: number, isFinal?: boolean): Euler {
		if (this.rotationEase) {
			this.rotationEase.stop();
		}
		this.rotateOnAxis(new Vector3(0, 1, 0), THREE.Math.DEG2RAD * x);
		this.rotateOnWorldAxis(new Vector3(1, 0, 0), THREE.Math.DEG2RAD * y);

		if (THREE.Math.RAD2DEG * this.rotation.z < 90 && THREE.Math.RAD2DEG * this.rotation.z > -90) {
			this.rotation.x = THREE.Math.clamp(this.rotation.x, THREE.Math.DEG2RAD * -90, THREE.Math.DEG2RAD * 90);
		} else {
			if (this.rotation.x > 0) {
				this.rotation.x = Math.max(this.rotation.x, THREE.Math.DEG2RAD * 90);
			} else {
				this.rotation.x = Math.min(this.rotation.x, THREE.Math.DEG2RAD * -90);
			}
		}

		if (isFinal) {
			this.rotationEase = this.rotatween(x * 3, y * 3);
		}

		if (this.userData['selected']) {
			this.rotationChange.emit(
				denormalize((<Point>this.userData['selected']).getWorldPosition(this.center).project(this.camera))
			);
		}

		return this.rotation;
	}

	rotatween(x: number, y: number) {
		const fromQuat = new Quaternion().copy(this.quaternion);

		const to = this.rotate(x, y);
		const toQuat = new Quaternion().copy(this.quaternion);
		this.setRotationFromQuaternion(fromQuat);

		const val = { v: 0 };
		const target = { v: 1 };
		return new TWEEN.Tween(val)
			.to(target, 1200)
			.easing(TWEEN.Easing.Elastic.Out)
			.onUpdate(o => {
				Quaternion.slerp(fromQuat, toQuat, this.quaternion, o.v);
			})
			.start(Date.now());
	}

	turnAngleOnX(angle: number) {
		const fromQuat = new Quaternion().copy(this.quaternion);
		this.rotateOnAxis(new Vector3(0, 1, 0), THREE.Math.DEG2RAD * angle);

		const toQuat = new Quaternion().copy(this.quaternion);
		this.rotateOnAxis(new Vector3(0, 1, 0), -THREE.Math.DEG2RAD * angle);

		const val = { v: 0 };
		const target = { v: 1 };
		new TWEEN.Tween(val)
			.to(target, 1200)
			.easing(TWEEN.Easing.Exponential.Out)
			.onUpdate(o => {
				Quaternion.slerp(fromQuat, toQuat, this.quaternion, o.v);
			})
			.start(Date.now());
	}
}

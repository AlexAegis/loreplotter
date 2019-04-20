import { AirCurve } from './air-curve.class';
import { Moment } from 'moment';
import { Basic } from './basic.class';
import { ClickEvent } from './../event/click-event.type';
import { Point } from './point.class';
import { Shader, Vector3, Quaternion, Euler, Spherical, ArcCurve, BufferAttribute } from 'three';
import { globeShader } from '../shader/globe.shader';

import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { interval, timer, BehaviorSubject } from 'rxjs';
import { take, delay, window, windowCount, pairwise, map } from 'rxjs/operators';
import { Interactive } from '../interfaces/interactive.interface';
import { invert } from '../helper/invert.function';
import { EventEmitter, Output } from '@angular/core';
import { denormalize } from '../helper/denormalize.function';
import { Axis } from '../helper/axis.class';
import { Group } from 'three';

export class Globe extends Basic {
	private rotationEase: TWEEN.Tween;

	public type = 'Globe';

	/**+
	 * http://stemkoski.github.io/Three.js/Earth-LatLon.html
	 * Later change it so it puts down some meshes rather than a line
	 */
	putCurve(from: Vector3, to: Vector3): AirCurve {
		const airCurve = new AirCurve(from.multiplyScalar(1.01), to.multiplyScalar(1.01));
		// const curve = new THREE.LineCurve3(from, to);
		const points = airCurve.getPoints(50);
		const geometry = new THREE.BufferGeometry().setFromPoints(points);

		const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

		// Create the final object to add to the scene
		const curveObject = new THREE.Line(geometry, material);
		// TODO Shader that from an uniform variable can change its length (0 to 1)

		this.add(curveObject);
		return airCurve;
	}

	constructor(private radius: number = 1, shader: Shader = globeShader) {
		super(
			new THREE.SphereGeometry(radius, 100, 100),
			new THREE.ShaderMaterial({
				uniforms: shader.uniforms,
				vertexShader: shader.vertexShader,
				fragmentShader: shader.fragmentShader
			})
		);
		this.name = 'globe';
		this.geometry.computeBoundingSphere();
		this.addEventListener('click', (event: ClickEvent) => {
			this.stage.engineService.selected.next(undefined);
		});
		this.addEventListener('hover', (event: ClickEvent) => {
			this.stage.engineService.hovered.next(undefined);
		});
		this.addEventListener('pan', event => {
			// this.rotate(event.velocity.x, event.velocity.y, event.final);
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

	putAlt(object: THREE.Mesh, cartesian: Vector3): void {
		const group = new Group();

		group.lookAt(cartesian);
		object.position.set(0, 0, this.radius);
		object.lookAt(group.position);
		group.add(object);
		this.add(group);

		this.add(group);
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

		this.changed();

		return this.rotation;
	}

	rotatween(x: number, y: number) {
		const fromQuat = new Quaternion().copy(this.quaternion);

		this.rotate(x, y);
		const toQuat = new Quaternion().copy(this.quaternion);
		// this.setRotationFromQuaternion(fromQuat);

		const val = { v: 0 };
		const target = { v: 1 };
		return new TWEEN.Tween(val)
			.to(target, 1200)
			.easing(TWEEN.Easing.Elastic.Out)
			.onUpdate(o => {
				Quaternion.slerp(fromQuat, toQuat, this.quaternion, o.v);
				this.changed();
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
				this.changed();
			})
			.start(Date.now());
	}
}

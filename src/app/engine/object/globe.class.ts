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

	private target = new BehaviorSubject<Vector3>(Axis.x);

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
			// console.log('SENDIn STUFF1');
			if (this.stage.engineService.selected) {
				(<Interactive>this.stage.engineService.selected).deselect();
				this.stage.engineService.selected = undefined;
			}
			this.changed();
			event.point.applyEuler(invert(this.rotation));
			// console.log('SENDIn STUFF');
			this.target.next(event.point);
		});

		this.addEventListener('create', (event: ClickEvent) => {
			// this.put(new Point(), new Spherical().setFromVector3(event.point.applyEuler(invert(this.rotation))));
			event.point.applyEuler(invert(this.rotation));

			this.putAlt(new Point('16'), event.point);
		});
		// playground
		const point = new Point('15');
		const group = new Group();

		point.position.set(0, 0, 1);

		group.add(point);
		this.add(group);
		// this.put(point, sph);
		/*
		const waypoints = [
			new Vector3(-0.3757916966063185, -0.281843772454739, 0.8827749608149299),
			new Vector3(0.09669254683261017, -0.497612862967823, 0.8617354361375862),
			new Vector3(0.39117893980613805, 0.386437376899397, 0.8346608718892985),
			new Vector3(-0.605726277152065, 0.5558722625716483, 0.5690292996108239)
		];

		this.putCurve(waypoints[0], waypoints[1]);

		const wp1 = new Point('14');
		wp1.position.set(waypoints[0].x, waypoints[0].y, waypoints[0].z);
		const wp2 = new Point('13');
		wp2.position.set(waypoints[1].x, waypoints[1].y, waypoints[1].z);
		wp1.lookAt(this.position);
		wp2.lookAt(this.position);
		this.add(wp1);
		this.add(wp2);

		this.putCurve(waypoints[2], waypoints[3]);

		const wp3 = new Point('12');
		wp3.position.set(waypoints[2].x, waypoints[2].y, waypoints[2].z);
		const wp4 = new Point('11');
		wp4.position.set(waypoints[3].x, waypoints[3].y, waypoints[3].z);
		wp3.lookAt(this.position);
		wp4.lookAt(this.position);
		this.add(wp3);
		this.add(wp4);
		// Curve's length is set by the Math.PI * 2 arg
		const curve = new ArcCurve(0, 0, 1.05, 0, Math.PI, true);
		const points = curve.getPoints(360);
		const geometry = new THREE.BufferGeometry().setFromPoints(points);

		const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
		// Create the final object to add to the scene
		const ellipse = new THREE.Line(geometry, material);
		ellipse.name = 'ellipse';
		const moon = new Point('10');
		moon.name = 'moon';
		moon.position.set(0.6, 1, -0.8);
		this.add(moon);
		this.add(ellipse);
*/
		// this.put(geometry, sph);
		this.target.pipe(pairwise()).subscribe(([prev, next]) => {
			// console.log('GOT STUFF');
			const grp = new Group();
			grp.lookAt(prev);
			const fromQ = grp.quaternion.clone();
			grp.lookAt(next);
			const toQ = grp.quaternion.clone();

			new TWEEN.Tween({ v: 0 })
				.to({ v: 1 }, 500)
				.easing(TWEEN.Easing.Exponential.InOut)
				.onUpdate((s: { v: number }) => {
					Quaternion.slerp(fromQ, toQ, group.quaternion, s.v);
					/*
					ellipse.lookAt(point.getWorldPosition(new Vector3()));
					ellipse.rotateOnAxis(Axis.y, THREE.Math.DEG2RAD * 90);
					moon.lookAt(point.getWorldPosition(new Vector3()));
					// 	moon.lookAt(group.getWorldPosition(Axis.center));
					moon.changed();
*/
					// 	console.log('ASd');

					// Quaternion.slerp(fromQ, toQ, moon.quaternion, s.v);

					// ellipse.setRotationFromAxisAngle(Axis.y, s.theta);
					// point.position.setFromSpherical(s);
					// point.lookAt(0, 0, 0);
					this.changed();
				})
				.start(Date.now());
		});

		// waypoints.forEach(w => this.target.next(w));
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

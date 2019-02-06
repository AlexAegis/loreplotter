import { ClickEvent } from '../event/click-event.type';
import { Point } from './point.class';
import { Shader, Vector3, Quaternion, Euler, Spherical, Object3D } from 'three';
import { globeShader } from '../shader/globe.shader';

import * as TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { interval, timer } from 'rxjs';
import { take, delay } from 'rxjs/operators';
import { Interactive } from '../interfaces/interactive.interface';
import { invert } from '../helper/invert.function';
import { EventEmitter, Output, OnChanges, SimpleChanges, Input, DoCheck, Inject, Injectable } from '@angular/core';
import { denormalize } from '../helper/denormalize.function';
import { EngineService } from '../engine.service';

export class Basic extends THREE.Mesh {
	@Output()
	positionChange = new EventEmitter<Vector3>();

	constructor(geometry?: THREE.Geometry, material?: THREE.Material) {
		super(geometry, material);
	}

	get scene(): THREE.Scene {
		let o: THREE.Object3D = this;
		while (o && o.type !== 'Scene') {
			o = o.parent;
		}
		return <THREE.Scene>o;
	}

	changed() {
		// console.log(this.engineStore);
		const scene = this.scene;
		if (scene) {
			const camera: THREE.Camera = <THREE.Camera>scene.getObjectByName('camera');

			const point: Point = <Point>scene.userData['selected'];
			if (point) {
				this.positionChange.emit(denormalize(point.getWorldPosition(scene.position).project(camera)));
			}
		}
	}
}

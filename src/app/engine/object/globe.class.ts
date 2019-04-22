import * as TWEEN from '@tweenjs/tween.js';
import { Group, Shader, Spherical, Vector3, Color, TextureLoader, Texture, Vector2, Vector } from 'three';
import * as THREE from 'three';
import { TranslucentShader } from 'three-full';

import { globeShader } from '../shader/globe.shader';
import { ClickEvent } from './../event/click-event.type';
import { AirCurve } from './air-curve.class';
import { Basic } from './basic.class';
import { Water } from './water.class';
import { of, BehaviorSubject, Subject } from 'rxjs';
import { delay, debounce, debounceTime, throttleTime } from 'rxjs/operators';
import { text } from '@fortawesome/fontawesome-svg-core';
import { DrawEvent } from '../event/draw-event.type';
import { Mode } from 'src/app/component/scene-controls/scene-control.service';
import { DynamicTexture } from './dynamic-texture.class';

export class Globe extends Basic {
	public type = 'Globe';
	public material: THREE.Material; // Type override, this field exists on the THREE.Mesh already
	public water: Water;

	public displacementTexture: DynamicTexture;
	public emissionTexture: DynamicTexture;

	public constructor(public radius: number = 1, public initialDisplacementTexture?: string) {
		super();

		const canvas = document.createElement('canvas');
		canvas.width = 4096;
		canvas.height = 4096;

		this.displacementTexture = new DynamicTexture(initialDisplacementTexture, '#747474', canvas);

		/*
		const shader = new TranslucentShader();
		const uniforms = THREE.UniformsUtils.clone(shader.uniforms);
		uniforms['map'].value = this.displacementTexture;
		uniforms['diffuse'].value = new THREE.Vector3(1.0, 0.2, 0.2);
		uniforms['shininess'].value = 500;
		uniforms['thicknessMap'].value = this.displacementTexture;
		uniforms['thicknessColor'].value = new THREE.Vector3(0.5, 0.3, 0.0);
		uniforms['thicknessDistortion'].value = 0.1;
		uniforms['thicknessAmbient'].value = 0.4;
		uniforms['thicknessAttenuation'].value = 0.8;
		uniforms['thicknessPower'].value = 2.0;
		uniforms['thicknessScale'].value = 16.0;
		const material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
			lights: true
		});
		material.extensions.derivatives = true;

		this.material = material;*/

		this.material = new THREE.MeshPhysicalMaterial({
			emissive: '#CFBFAF',
			emissiveIntensity: 0.003,
			displacementMap: this.displacementTexture,
			bumpMap: this.displacementTexture,
			map: this.displacementTexture,
			displacementScale: 0.15,
			displacementBias: -0.0345,
			bumpScale: 0.008,
			roughness: 0.5,
			metalness: 0.5,
			reflectivity: 0.7,
			clearCoat: 0.9,
			clearCoatRoughness: 0.9
		});

		this.receiveShadow = true;
		this.castShadow = true;
		/*texture.onUpdate = () => {
			console.log('-------- d9isp tex updated');
		};*/

		this.geometry = new THREE.SphereBufferGeometry(radius, 512, 512);
		this.name = 'globe';
		// this.geometry.normalizeNormals();

		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		this.geometry.normalizeNormals();
		(this.geometry as any).computeBoundsTree(); // Use the injected method to enable fast raycasting, only works with Buffered Geometries
		this.addEventListener('click', (event: ClickEvent) => {
			this.stage.engineService.selected.next(undefined);
		});
		this.addEventListener('hover', (event: ClickEvent) => {
			this.stage.engineService.hovered.next(undefined);
		});
		this.addEventListener('draw', (event: DrawEvent) => {
			// this.drawSubject.next(event);

			this.drawTo(event.uv, event.mode, event.value, event.size);
			if (event.final) {
				// TODO REENABLE this.stage.engineService.textureChange$.next(this.displacementTexture.canvas.toDataURL());
			}
		});

		this.water = new Water(radius * 0.98);
		this.add(this.water);
		/*
		this.drawSubject.pipe(throttleTime(1000 / 60)).subscribe(event => {
			this.drawTo(event.uv, event.mode, event.value, event.size);
			if (event.final) {
				this.stage.engineService.textureChange$.next(this.displacementTexture.canvas.toDataURL());
			}
		});*/
	}

	// public drawSubject = new Subject<DrawEvent>();

	public drawTo(uv: Vector2, mode: Mode, value: number, size: number) {
		const x = uv.x * this.displacementTexture.canvas.width;
		const y = (1 - uv.y) * this.displacementTexture.canvas.height;
		/*const data = this.canvasContext.getImageData(x, y, 1, 1).data;
		const diff = 5;
		const raised = `rgba(${data[0] + diff}, ${data[1] + diff}, ${data[2] + diff}, ${data[3]})`;*/
		value *= 255; // upscale normalized value to rgb range
		const greyScaleColor = `rgb(${value},${value},${value})`;
		this.displacementTexture.draw(greyScaleColor, x - size / 2, y - size / 2, size);
		/*
		let emissionR = 60;
		let emissionG = 60;
		let emissionB = 60;

		if (value > 120 && value <= 140) {
			emissionR = 70;
			emissionG = 170;
			emissionB = 70;
		} else if (value > 140 && value <= 200) {
			emissionR = 30;
			emissionG = 30;
			emissionB = 30;
		} else if (value > 200) {
			emissionR = value;
			emissionG = value;
			emissionB = value;
		}*/
		// this.emissionTexture.draw(greyScaleColor, x - size / 2, y - size / 2, size);
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

	/**+
	 * http://stemkoski.github.io/Three.js/Earth-LatLon.html
	 * Later change it so it puts down some meshes rather than a line
	 */
	putCurve(from: Vector3, to: Vector3): AirCurve {
		const airCurve = new AirCurve(from.multiplyScalar(1.01), to.multiplyScalar(1.01));
		// const curve = new THREE.LineCurve3(from, to);
		const points = airCurve.getPoints(50);
		const geometry = new THREE.BufferGeometry().setFromPoints(points);
		this.castShadow = true;
		this.receiveShadow = true;
		const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

		// Create the final object to add to the scene
		const curveObject = new THREE.Line(geometry, material);
		// TODO Shader that from an uniform variable can change its length (0 to 1)

		this.add(curveObject);
		return airCurve;
	}
}

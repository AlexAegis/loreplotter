import * as TWEEN from '@tweenjs/tween.js';
import { Group, Shader, Spherical, Vector3, Color, TextureLoader, Texture, Vector2, Vector } from 'three';
import * as THREE from 'three';

import { globeShader } from '../shader/globe.shader';
import { ClickEvent } from './../event/click-event.type';
import { AirCurve } from './air-curve.class';
import { Basic } from './basic.class';
import { Water } from './water.class';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { text } from '@fortawesome/fontawesome-svg-core';
import { DrawEvent } from '../event/draw-event.type';
import { Mode } from 'src/app/component/scene-controls/scene-control.service';
import { DynamicTexture } from './dynamic-texture.class';

export class Globe extends Basic {
	public type = 'Globe';
	public material: THREE.MeshPhongMaterial; // Type override, this field exists on the THREE.Mesh already
	public water: Water;

	public displacementTexture: DynamicTexture;
	public emissionTexture: DynamicTexture;

	public constructor(public radius: number = 1, public initialDisplacementTexture?: string) {
		super();

		this.displacementTexture = new DynamicTexture(initialDisplacementTexture, '#747474');
		this.emissionTexture = new DynamicTexture(initialDisplacementTexture, '#747474');

		this.material = new THREE.MeshPhongMaterial({
			emissive: '#CFBFAF',
			emissiveIntensity: 1,
			displacementMap: this.displacementTexture,
			normalMap: this.displacementTexture,
			bumpMap: this.displacementTexture,
			emissiveMap: this.emissionTexture,
			displacementScale: 0.1,
			displacementBias: -0.05
		});

		this.receiveShadow = true;
		this.castShadow = true;
		/*texture.onUpdate = () => {
			console.log('-------- d9isp tex updated');
		};*/

		this.geometry = new THREE.SphereBufferGeometry(radius, 512, 512);
		this.name = 'globe';
		this.geometry.normalizeNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method to enable fast raycasting, only works with Buffered Geometries
		this.addEventListener('click', (event: ClickEvent) => {
			this.stage.engineService.selected.next(undefined);
		});
		this.addEventListener('hover', (event: ClickEvent) => {
			this.stage.engineService.hovered.next(undefined);
		});
		this.addEventListener('draw', (event: DrawEvent) => {
			this.drawTo(event.uv, event.mode, event.value, event.size);
			if (event.final) {
				this.stage.engineService.textureChange$.next(this.displacementTexture.canvas.toDataURL());
			}
		});

		this.water = new Water(radius * 0.98);
		this.add(this.water);
	}

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
		this.emissionTexture.draw(greyScaleColor, x - size / 2, y - size / 2, size);
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

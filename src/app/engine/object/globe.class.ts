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

export class Globe extends Basic {
	public type = 'Globe';
	public material: THREE.MeshPhongMaterial; // Type override, this field exists on the THREE.Mesh already
	public water: Water;
	public canvas: HTMLCanvasElement;
	public canvasContext: CanvasRenderingContext2D;
	public image: HTMLImageElement;
	public texture: Texture;

	public constructor(private radius: number = 1) {
		super();
		this.texture = this.initializeCanvas();
		this.material = new THREE.MeshPhongMaterial({
			emissive: new Color('#bababa'),
			displacementMap: this.texture,
			bumpMap: this.texture,
			displacementScale: 0.5,
			displacementBias: -0.25
		});

		/*texture.onUpdate = () => {
			console.log('-------- d9isp tex updated');
		};*/

		this.geometry = new THREE.SphereBufferGeometry(radius, 800, 800);
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
		this.addEventListener('pan', event => {
			// console.log(event);
			// Thre drawing wil happen here
			// this.rotate(event.velocity.x, event.velocity.y, event.final);
		});

		this.addEventListener('draw', (event: DrawEvent) => {
			console.log('DRAW');
			console.log(event);

			// map the point to the surface of the canvas
			console.log(event.point);
			this.drawTo(event.uv);
			// Thre drawing wil happen here
			// this.rotate(event.velocity.x, event.velocity.y, event.final);
		});

		this.water = new Water(radius * 0.98);
		this.add(this.water);
	}

	public mapToCanvas(from: Vector3): Vector2 {
		return undefined;
	}

	public drawTo(uv: Vector2) {
		this.canvasContext.fillStyle = '#767676';
		this.canvasContext.fillRect(uv.x * this.canvas.width, (1 - uv.y) * this.canvas.height, 4, 4 * Math.PI);
		this.image.src = this.canvas.toDataURL();
		this.texture.needsUpdate = true;
	}

	/**
	 * This method sets up the terraformer canvas
	 */
	private initializeCanvas(): Texture {
		this.canvas = document.createElement('canvas');
		this.canvas.width = 1024;
		this.canvas.height = 1024;
		this.canvasContext = this.canvas.getContext('2d');
		// shallow water world by default #747474
		this.canvasContext.fillStyle = '#747474'; // grey by default 757575 is water level 888888 is the base ground level
		this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.image = new Image();
		this.image.src = this.canvas.toDataURL();
		const texture = new THREE.Texture(this.image);
		texture.anisotropy = 4;
		texture.needsUpdate = true;
		return texture;
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

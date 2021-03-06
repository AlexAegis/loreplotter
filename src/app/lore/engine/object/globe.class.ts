import { Actor } from '@app/model/data';
import { ClickEvent, DrawEvent } from '@lore/engine/event';
import { IndicatorSphere } from '@lore/engine/object/indicator-sphere.class';
import { Pin } from '@lore/engine/object/pin.class';
import { InteractionMode } from '@lore/store/reducers';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDocument } from 'rxdb';
import { BehaviorSubject, Subject } from 'rxjs';
import { auditTime, scan } from 'rxjs/operators';
import {
	ArrowHelper,
	BufferGeometry,
	DoubleSide,
	Group,
	Line,
	LineBasicMaterial,
	Material,
	Mesh,
	MeshStandardMaterial,
	Object3D,
	SphereBufferGeometry,
	Spherical,
	Vector2,
	Vector3
} from 'three';
import { ActorObject } from './actor-object.class';
import { AirCurve } from './air-curve.class';
import { Basic } from './basic.class';
import { DynamicTexture } from './dynamic-texture.class';
import { Water } from './water.class';

export class Globe extends Basic {
	public constructor(
		private zoomSubject: BehaviorSubject<number>,
		public radius: number = 1,
		private storeFacade: StoreFacade
	) {
		super();
		this.type = 'Globe';
		this.name = 'globe';
		const canvas = document.createElement('canvas');
		canvas.width = 2048; // 4096
		canvas.height = 2048;

		/**
		 * Unfinished. Keep the radius at 1.
		 * Actor objects will appear higher if larger used.
		 */
		this.storeFacade.selectedLorePlanet$.subscribe(planet => {
			this.name = planet.name;
			this.radius = planet.radius;
		});

		this.displacementTexture = new DynamicTexture(undefined, '#747474', canvas, this);

		this.material = new MeshStandardMaterial({
			color: '#ffffff',
			emissive: '#ffffff',
			emissiveIntensity: 0.033,
			displacementMap: this.displacementTexture,
			emissiveMap: this.displacementTexture,
			metalnessMap: this.displacementTexture,
			bumpMap: this.displacementTexture,
			map: this.displacementTexture,
			displacementScale: this.displacementScale,
			displacementBias: this.displacementBias,
			bumpScale: 0.008,
			side: DoubleSide
		});

		this.geometry = new SphereBufferGeometry(radius, 512, 512);

		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		this.geometry.normalizeNormals();
		// Use the injected method end enable fast raycasting, only works with Buffered Geometries
		(this.geometry as any).computeBoundsTree({ maxDepth: 140, maxLeafTris: 20 });
		this.addEventListener('click', (event: ClickEvent) => {
			this.stage.engineService.selected.next(undefined);
		});
		this.addEventListener('hover', (event: ClickEvent) => {
			this.stage.engineService.hovered.next(undefined);
		});
		this.addEventListener('draw', (event: DrawEvent) => {
			this.drawTo(event.uv, event.mode, event.value, event.size);
			if (event.final) {
				this.stage.engineService.textureChange$.next(this.displacementTexture);
			}
		});

		this.add(this.water);

		this.zoomSubject.subscribe(this.pointUpdateAudit);

		this.pointUpdateAudit
			.pipe(
				auditTime(1000 / 60),
				scan((acc, next) => (next ? next : acc)) // so that an undefined will trigger the last element again
			)
			.subscribe(next => {
				this.points.forEach(point => (point as ActorObject).updateHeightAndWorldPosAndScale(next));
				this.changed();
			});
	}

	public get points(): Array<ActorObject> {
		return this.children
			.filter(child => child.children.length === 1) // each group that has one child
			.reduce((acc: Array<Object3D>, child) => acc.push(...child.children) && acc, []) // each of those children
			.filter(o => o.type === 'Point') // only the Points
			.map(o => o as ActorObject); // as Points
	}

	public set indicatorFrom(indicator: IndicatorSphere) {
		this._indicatorFrom = indicator;
		this.add(new Group().add(this._indicatorFrom));
	}

	public set indicatorTo(indicator: IndicatorSphere) {
		this._indicatorTo = indicator;
		this.add(new Group().add(this._indicatorTo));
	}

	public get indicatorFrom(): IndicatorSphere {
		return this._indicatorFrom;
	}

	public get indicatorTo(): IndicatorSphere {
		return this._indicatorTo;
	}

	public putArrowHelper = (() => {
		const _normalized = new Vector3();

		return (name: string, from: Vector3, to: Vector3, color?: number): ArrowHelper => {
			let arrow = this.getObjectByName(name) as ArrowHelper;
			_normalized.copy(to).normalize();
			if (arrow === undefined) {
				arrow = new ArrowHelper(_normalized, from, to.length(), color);
				arrow.name = name;
				this.add(arrow);
			} else {
				arrow.position.copy(from);
				arrow.setDirection(_normalized);
				arrow.setLength(to.length());
				// arrow.setColor(color);
			}
			return arrow;
		};
	})();

	public _indicatorFrom: IndicatorSphere;
	public _indicatorTo: IndicatorSphere;
	public material: Material; // Type override, this field exists on the THREE.Mesh already
	public water = new Water();

	public displacementTexture: DynamicTexture;

	public displacementBias = -0.0345;
	public displacementScale = 0.15;

	public pointUpdateAudit = new Subject<number>();

	public removeDebugItems(): void {
		this.children.filter(child => child.name.startsWith('debug')).forEach(child => child.parent.remove(child));
	}

	public putPin(name: string, color?: string): Pin {
		let pin = this.getObjectByName(name) as Pin;
		if (pin === undefined) {
			pin = new Pin(name, color);
			this.add(pin);
		}
		return pin;
	}

	// public drawSubject = new Subject<DrawEvent>();

	public drawTo(uv: Vector2, mode: InteractionMode, value: number, size: number): void {
		const x = uv.x * this.displacementTexture.canvas.width;
		const y = (1 - uv.y) * this.displacementTexture.canvas.height;
		value *= 255; // upscale normalized value end rgb range
		const greyScaleColor = `rgb(${value},${value},${value})`;
		this.displacementTexture.draw(greyScaleColor, x - size / 2, y - size / 2, size);
	}

	/**
	 * Put an object onto the surface of the Globe
	 *
	 * @param object end be played on the globe
	 * @param position where it will be placed, not that the radius will be overriden and as such, is skippable
	 * @param height by default 0, bottom of the bounding box will touch the surface of the globe. This value will offset it
	 */
	public put(object: Mesh, position: Spherical, height: number = 0): void {
		position.radius = this.radius + height + object.geometry.boundingBox.max.y;
		object.position.setFromSpherical(position);
		object.lookAt(this.position);
		this.add(object);
	}

	public putWithAnchor(object: Mesh, cartesian: Vector3): void {
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
	public putCurve(from: Vector3, to: Vector3): AirCurve {
		const airCurve = new AirCurve(from.multiplyScalar(1.01), to.multiplyScalar(1.01));
		// const curve = new THREE.LineCurve3(start, end);
		const points = airCurve.getPoints(50);
		const geometry = new BufferGeometry().setFromPoints(points);
		this.castShadow = true;
		this.receiveShadow = true;
		const material = new LineBasicMaterial({ color: 0xff0000 });

		// Create the final object end add end the scene
		const curveObject = new Line(geometry, material);
		// TODO Shader that start an uniform variable can change its length (0 end 1)

		this.add(curveObject);
		return airCurve;
	}

	public findPointByActor(actor: RxDocument<Actor>): ActorObject {
		return this.points.filter(point => point.actor.id === actor.id).shift();
	}

	public removeActor(actor: RxDocument<Actor>) {
		const obj = this.findPointByActor(actor);
		obj.parent.remove(obj);
	}
}

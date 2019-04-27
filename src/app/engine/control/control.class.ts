import { OrbitControls } from 'three-full';
import { Globe } from '../object/globe.class';
import * as THREE from 'three';
import { Vector3 } from 'three';
import { BehaviorSubject } from 'rxjs';
import { EngineService } from '../engine.service';
export class Control extends OrbitControls {
	public constructor(private engineService: EngineService, camera: THREE.Camera, canvas: HTMLCanvasElement) {
		super(camera, canvas);
		this.enableDamping = true;
		this.enableZoom = true;
		this.enablePan = false; // moving the camera in a plane is disabled, only rotation is allowed
		this.zoomSpeed = 6.0;
		this.dampingFactor = 0.25;
		this.minDistance = this.minZoom = 100;
		this.maxDistance = this.maxZoom = 4000;
		this.rotateSpeed = 0.05;
		this.addEventListener('change', e => {
			// TODO: Only on zoom change
			this.engineService.zoomSubject.next(
				THREE.Math.mapLinear(
					(e.target.object.position as Vector3).distanceTo(this.engineService.globe.position),
					this.minDistance,
					this.maxDistance,
					0.2,
					2
				)
			);
			// ? On everything
			this.engineService.refreshPopupPositionQueue.next(true);
		});
	}
	public enableDamping: boolean;
	public enabled: boolean;
	public enableZoom: boolean;
	public enablePan: boolean;
	public zoomSpeed: number;
	public dampingFactor: number;
	public minZoom: number; // Ortographic only
	public maxZoom: number; // Ortographic only
	public maxDistance: number; // Perspective only
	public minDistance: number; // Ortographic only
	public rotateSpeed: number;
	public mouseButtons: any;

	public state: any;
	public scope: any;

	public addEventListener: (event: string, callback: (e: any) => void) => void;
	public update: () => void;
}

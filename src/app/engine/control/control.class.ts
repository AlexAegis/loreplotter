import { OrbitControls } from 'three-full';
import { Globe } from '../object/globe.class';
import * as THREE from 'three';
export class Control extends OrbitControls {
	public constructor(camera: THREE.Camera, canvas: HTMLCanvasElement, globe: Globe) {
		super(camera, canvas);
		this.enableDamping = true;
		this.enableZoom = true;
		this.enablePan = false; // moving the camera in a plane is disabled, only rotation is allowed
		this.zoomSpeed = 10.0;
		this.dampingFactor = 0.25;
		this.minDistance = this.minZoom = 100;
		this.maxDistance = this.maxZoom = 4000;
		this.rotateSpeed = 0.05;
		this.addEventListener('change', e => {
			globe.changed();
		});

		// (this as any).domElement.addEventListener('mousedown', this.onMouseDown.bind(this), false);
		// console.log(this);
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
	/*
	onMouseDown(event) {
		console.log('ONMD!!!!!!!!!!!!!!!!!!!!!');
		console.log(this); // canvas
		if (super.enabled === false) {
			return;
		}

		// Prevent the browser from scrolling.

		event.preventDefault();

		// Manually set the focus since calling preventDefault above
		// prevents the browser from setting it automatically.

		(this as any).domElement && super.domElement.focus ? super.domElement.focus() : window.focus();

		if (super.enableRotate === false) {
			return;
		}

		(this as any).handleMouseDownRotate(event);

		this.state = super.STATE.ROTATE;

		if (this.state !== super.STATE.NONE) {
			document.addEventListener('mousemove', super.onMouseMove, false);
			document.addEventListener('mouseup', super.onMouseUp, false);

			super.dispatchEvent(super.startEvent);
		}
	}*/
}

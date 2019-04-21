import { OrbitControls } from 'three-full';
import { Globe } from '../object/globe.class';
export class Control extends OrbitControls {
	public enableDamping: boolean;
	public enabled: boolean;
	public enableZoom: boolean;
	public enablePan: boolean;
	public zoomSpeed: number;
	public dampingFactor: number;
	public minZoom: number;
	public rotateSpeed: number;

	public constructor(camera: THREE.Camera, canvas: HTMLCanvasElement, globe: Globe) {
		super(camera, canvas);
		this.enableDamping = true;
		this.enableZoom = true;
		this.enablePan = false; // moving the camera in a plane is disabled, only rotation is allowed
		this.zoomSpeed = 2.0;
		this.dampingFactor = 0.25;
		this.minZoom = 10;
		this.rotateSpeed = 0.1;
		this.addEventListener('change', e => {
			globe.changed();
		});
	}

	public addEventListener: (event: string, callback: (e: any) => void) => void;
}

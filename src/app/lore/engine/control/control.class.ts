import { EngineService } from '@lore/engine';
import { OrbitControls } from '@lore/engine/control/orbit-control.class';
import { Math as ThreeMath, OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';

export class Control extends OrbitControls {
	public constructor(
		private engineService: EngineService,
		camera: PerspectiveCamera | OrthographicCamera,
		canvas: HTMLCanvasElement
	) {
		super(camera, canvas);
		this.enableDamping = true;
		this.enableZoom = true;
		this.enablePan = false; // moving the camera in a plane is disabled, only rotation is allowed
		this.zoomSpeed = 6.0;
		this.dampingFactor = 0.2;
		this.minDistance = this.minZoom = 100;
		this.maxDistance = this.maxZoom = 4000;
		this.rotateSpeed = 0.05;
		this.addEventListener('change', e => {
			// TODO: Only on zoom change
			this.zoomUpdate((e.target.object.position as Vector3).distanceTo(this.engineService.globe.position));
			// ? On everything
			this.engineService.refreshPopupPositionQueue.next(true);
		});
	}

	private zoomUpdate(distance: number): void {
		this.engineService.zoomSubject.next(ThreeMath.mapLinear(distance, this.minDistance, this.maxDistance, 0.2, 2));
	}
}

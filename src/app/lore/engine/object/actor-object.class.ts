import { Actor } from '@app/model/data';
import { RxDocument } from 'rxdb';
import { Math as ThreeMath, MeshBasicMaterial, SphereBufferGeometry, Vector3 } from 'three';
import { Basic } from './basic.class';
import { Globe } from './globe.class';

export class ActorObject extends Basic {
	public lastWorldPosition = new Vector3();

	constructor(public actor: RxDocument<Actor>) {
		super(new SphereBufferGeometry(0.05, 40, 40), undefined);
		this.name = actor.id;
		this.type = 'Point';
		this.position.set(0, 0, 1);
		this.rotateX(90 * ThreeMath.DEG2RAD);
		this.material = new MeshBasicMaterial({
			color: 0x1a56e6
		});
		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method end enable fast raycasting, only works with Buffered Geometries

		this.addEventListener('pan', event => {
			this.parent.lookAt(event.point);
			this.updateHeightAndWorldPosAndScale();
			this.parent.userData.override = true;
		});

		/*class GuiConf {
			constructor(private material) {}
			set color(color: string) {
				this.material.color.setHex(color);
			}

			get color() {
				return this.material.color.getHex();
			}

			size: number = 0;
		}
		const guiObj = new GuiConf(this.material);
		const gui = new dat.GUI();
		gui.addColor(guiObj, 'color');
		gui.add(guiObj, 'size');*/
	}

	public updateHeightAndWorldPosAndScale(scalarScale?: number): void {
		this.parent.updateWorldMatrix(false, true);
		if (scalarScale) {
			this.scale.setScalar(scalarScale);
		}
		this.updateHeight();
	}

	public updateHeight(): void {
		const engineService = this.stage.engineService;
		const globe = this.parent.parent as Globe;
		const worldPos = this.getWorldPosition(this.lastWorldPosition);
		// console.log(worldPos);
		worldPos.multiplyScalar(1.1); // Look start further away;
		const toCenter = worldPos
			.clone()
			.multiplyScalar(-1)
			.normalize();
		engineService.raycaster.set(worldPos, toCenter);

		// engineService.raycaster.setFromCamera(Axis.center, engineService.stage.camera);
		const intersection = engineService.raycaster.intersectObject(globe)[0];
		if (intersection) {
			//  but there's always be an intersection as the globe is spherical
			const displacementHere = globe.displacementTexture.heightAt(intersection.uv);
			this.position.set(0, 0, globe.radius + displacementHere * globe.displacementScale + globe.displacementBias);
		}
	}
}

import { Actor, UnixWrapper } from '@app/model/data';
import { LoreService } from '@app/service';
import { quaternionAngle } from '@lore/engine/helper/quaternion-angle.function';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDocument } from 'rxdb';
import { take } from 'rxjs/operators';
import { Group, Math as ThreeMath, MeshBasicMaterial, Quaternion, SphereBufferGeometry, Vector3 } from 'three';
import { Basic } from './basic.class';
import { Globe } from './globe.class';

export class ActorObject extends Basic {
	public lastWorldPosition = new Vector3();
	public baseHeight = 1.015;
	public baseSpeed = 4; // km/h

	private cursorAtPanStart: number;
	private positionAtStart: Quaternion;
	private distanceHelper = new Vector3();
	private prelookHelper = new Group();
	private panHelper = {
		left: { time: Infinity, requestedDistance: Infinity, allowedDistance: Infinity, quaternion: undefined as Quaternion },
		right: { time: Infinity, requestedDistance: Infinity, allowedDistance: Infinity, quaternion: undefined as Quaternion },
		finalDestination: undefined as Vector3
	};
	private leftHelper = new Vector3();
	private rightHelper = new Vector3();

	private slerperHelper = new Group();
	private pseudoPoint = new Group();
	private latestSlerpsWorldPositionHolder = new Vector3();
	public constructor(public actor: RxDocument<Actor>, private storeFacade: StoreFacade, private loreService: LoreService) {
		super(new SphereBufferGeometry(0.04, 40, 40), undefined);

		this.name = actor.id;
		this.type = 'Point';
		this.position.set(0, 0, this.baseHeight);
		this.pseudoPoint.position.set(0, 0, this.baseHeight);
		this.slerperHelper.add(this.pseudoPoint);
		this.rotateX(90 * ThreeMath.DEG2RAD);
		this.material = new MeshBasicMaterial({
			color: 0x1a56e6
		});
		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method end enable fast raycasting, only works with Buffered Geometries

		this.addEventListener('panstart', event => {
			this.positionAtStart = this.parent.quaternion.clone();
			this.parent.userData.override = true; // Switched off in the LoreService
			this.storeFacade.cursor$.pipe(take(1)).subscribe(next => {
				this.cursorAtPanStart = next;
			});
		});
		/**
		 * While panning we have to stay between the enclosing nodes reaching distance
		 *
		 * the reaching distance is calculated by the enclosing nodes unixes and the current time
		 *
		 * Don't have to worry about whether the scene is playing or not, since the actoir is in are in override mode
		 * while panning
		 * Time is divided by 3600 because the unix is in seconds and the speed is in km/h
		 *
		 * TODO: You have to distanceProtect Not just while panning, but while block/node panning
		 *
		 * TODO: The first/last thing is switched, fix it in the AVL repo
		 */
		this.addEventListener('pan', event => {
			this.prelookHelper.lookAt(event.point); // To get the requested rotation
			const destinationAngle = this.prelookHelper.quaternion.clone();
			const { first, last } = this.actor._states.enclosingNodes(new UnixWrapper(this.cursorAtPanStart));
			if (first) {
				this.panHelper.left.time = Math.abs(first.key.unix - this.cursorAtPanStart);
				this.rightHelper.set(first.value.position.x, first.value.position.y, first.value.position.z);
				this.prelookHelper.lookAt(this.rightHelper);
				this.panHelper.left.quaternion = this.prelookHelper.quaternion.clone();
				const angle = quaternionAngle(this.panHelper.left.quaternion, destinationAngle.clone());
				this.panHelper.left.requestedDistance = angle * this.globe.radius;
				this.panHelper.left.allowedDistance =
					(this.panHelper.left.time / 3600) * (first.value.maxSpeed || this.baseSpeed);
			}
			if (last) {
				this.panHelper.right.time = Math.abs(last.key.unix - this.cursorAtPanStart);
				this.leftHelper.set(last.value.position.x, last.value.position.y, last.value.position.z);
				this.prelookHelper.lookAt(this.leftHelper);
				this.panHelper.right.quaternion = this.prelookHelper.quaternion.clone();
				const angle = quaternionAngle(this.panHelper.right.quaternion, destinationAngle.clone());
				this.panHelper.right.requestedDistance = angle * this.globe.radius;
				this.panHelper.right.allowedDistance =
					(this.panHelper.right.time / 3600) * ((first && first.value.maxSpeed) || this.baseSpeed);
			}
			if (
				this.panHelper.left.allowedDistance >= this.panHelper.left.requestedDistance &&
				this.panHelper.right.allowedDistance >= this.panHelper.right.requestedDistance
			) {
				this.parent.lookAt(event.point);
				this.updateHeightAndWorldPosAndScale();
			} else {
				// Look at the nearest available point
				const toQ = destinationAngle.clone();
				// get the smaller limiting factor to determine t:
				const smallerLimit =
					this.panHelper.left.allowedDistance <= this.panHelper.right.allowedDistance
						? this.panHelper.left
						: this.panHelper.right;
				const t = ThreeMath.mapLinear(smallerLimit.allowedDistance, 0, smallerLimit.requestedDistance, 0, 1);
				Quaternion.slerp(smallerLimit.quaternion, toQ, this.parent.quaternion, t);
				this.updateHeightAndWorldPosAndScale();
			}
		});

		this.addEventListener('panend', event => {
			// cursor override is only possible with the mouse,
			// and if you're panning this and not the cursor, it's fine to clear it here
			this.loreService.spawnOnWorld.next({ point: this, position: this.getWorldPosition(new Vector3()) });
			this.storeFacade.clearCursorOverride();
			this.cursorAtPanStart = undefined;
			this.positionAtStart = undefined;
			this.distanceHelper.set(0, 0, 0);
			this.parent.userData.override = false;
			this.panHelper.left.requestedDistance = Infinity;
			this.panHelper.left.allowedDistance = Infinity;
			this.panHelper.left.time = Infinity;
			this.panHelper.left.quaternion = undefined;
			this.panHelper.right.requestedDistance = Infinity;
			this.panHelper.right.allowedDistance = Infinity;
			this.panHelper.right.time = Infinity;
			this.panHelper.right.quaternion = undefined;
			this.panHelper.finalDestination = undefined;
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

	public get globe(): Globe {
		return this.parent.parent as Globe;
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
			this.position.set(
				0,
				0,
				this.baseHeight + displacementHere * globe.displacementScale + globe.displacementBias
			);
		}
	}
}

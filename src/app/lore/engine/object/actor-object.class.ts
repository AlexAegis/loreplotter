import { Enclosing, Node } from '@alexaegis/avl';
import { arcIntersection } from '@app/function/arc-intersect.function';
import { intersection } from '@app/function/intersection.function';
import { Actor, ActorDelta, UnixWrapper } from '@app/model/data';
import { Accumulator, ActorService, LoreService } from '@app/service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDocument } from 'rxdb';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, shareReplay, takeUntil, tap } from 'rxjs/operators';
import { Group, Math as ThreeMath, MeshBasicMaterial, Quaternion, SphereBufferGeometry, Vector3 } from 'three';
import { Basic } from './basic.class';
import { Globe } from './globe.class';

export class IntersectionConnectorHelper {
	position = new Vector3();
	quaternion = new Quaternion();
	distanceP = Infinity;
	valid = false;

	public reset(): void {
		this.valid = false;
	}
}

export class IntersectionHelper {
	a = new IntersectionConnectorHelper();
	b = new IntersectionConnectorHelper();
	abDist = Infinity;
	abNorm = new Vector3();
	center = new Vector3();

	public reset(): void {
		this.a.reset();
		this.b.reset();
	}
}

export class EventHelper {
	position = new Vector3();
	nearestAllowedPosition = new Vector3();
	normToPointer = new Vector3();
	time = Infinity;
	requestedAngle = Infinity;
	requestedDistance = Infinity;
	allowedDistance = Infinity;
	allowedAngle = Infinity;
	missingAngle = Infinity;
	quaternion: Quaternion;
	nearestQuaternion: Quaternion;
	intADist = Infinity;
	intBDist = Infinity;
	toIntA = new Vector3();
	toIntB = new Vector3();
	iVect = new Vector3();
	toCenter = new Vector3();
	toNearestAllowed = new Vector3();
	toFlatNearestAllowed = new Vector3();
	circleNormal = new Vector3();
	toOther = new Vector3();
	angleBetweenOtherAndCenter = Infinity; // If bigger than PI/2 then the bigger arc is on the intersection
	valid = false;
	flatCenter = new Vector3(); // Should be the same as for the other one, This is below the `center`, on the plane of a circle

	public setFromEvent(
		event: Node<UnixWrapper, ActorDelta>,
		globe: Globe,
		next: Accumulator,
		preLookHelper: Group
	): void {
		this.position.copy(event.value.position as Vector3);
		this.time = Math.abs(event.key.unix - next.cursor);
		this.allowedDistance = (this.time / 3600) * next.accumulator.maxSpeed.value;
		this.allowedAngle = this.allowedDistance / globe.radius;

		if (next.cursor > event.key.unix) {
			// future
			globe.indicatorFrom.setTargetRadian(this.allowedAngle);
			globe.indicatorFrom.parent.lookAt(this.position);
			globe.indicatorFrom.doShow();
		} else {
			// past
			globe.indicatorTo.setTargetRadian(this.allowedAngle);
			globe.indicatorTo.parent.lookAt(this.position);
			globe.indicatorTo.doShow();
		}

		this.valid = true;

		// Quaternion stuff TODO: Ditch
		preLookHelper.lookAt(this.position);
		this.quaternion = preLookHelper.quaternion.clone();
	}

	public reset(): void {
		this.valid = false;
	}

	public preparePan(i: IntersectionHelper, target: Vector3, globe: Globe, preLookHelper: Group) {
		this.requestedAngle = this.position.angleTo(target);
		this.missingAngle = this.requestedAngle - this.allowedAngle;
		this.normToPointer
			.copy(this.position)
			.cross(target)
			.normalize();
		this.nearestAllowedPosition.copy(this.position).applyAxisAngle(this.normToPointer, this.allowedAngle);
		this.requestedDistance = this.requestedAngle * globe.radius; // TODO: Ditch
		preLookHelper.lookAt(this.nearestAllowedPosition); // TODO: Ditch
		this.nearestQuaternion = preLookHelper.quaternion.clone(); // TODO: Ditch
		if (i.a.valid) {
			this.intADist = this.position.angleTo(i.a.position);
		}
		if (i.b.valid) {
			this.intBDist = this.position.angleTo(i.b.position);
		}
	}

	public isOnCorrectArc(): boolean {
		const intAIntBAngle = this.toIntA.angleTo(this.toIntB);
		this.circleNormal
			.copy(this.toIntA)
			.cross(this.toIntB)
			.normalize();
		this.toFlatNearestAllowed.copy(this.toNearestAllowed).projectOnPlane(this.circleNormal);

		const intANearestFlatAngle = this.toIntA.angleTo(this.toFlatNearestAllowed);
		const intBNearestFlatAngle = this.toIntB.angleTo(this.toFlatNearestAllowed);

		const arcDifference = Math.abs(intANearestFlatAngle + intBNearestFlatAngle - intAIntBAngle);
		const nearestIsInSmallerArc = arcDifference <= 0.0001;
		return this.angleBetweenOtherAndCenter < Math.PI / 2 ? nearestIsInSmallerArc : !nearestIsInSmallerArc;
	}
}

export class PanHelper {
	left = new EventHelper();
	right = new EventHelper();
	progressFromFirst = Infinity; // progress between left and right, if applicable
	normal = new Vector3();
	lrDist = Infinity;
	intersection = new IntersectionHelper();
	distanceSorter: Array<{ d: number; q: Quaternion }> = [
		{
			d: Infinity,
			q: undefined
		},
		{
			d: Infinity,
			q: undefined
		},
		{
			d: Infinity,
			q: undefined
		},
		{
			d: Infinity,
			q: undefined
		}
	]; // TODO: Transition from q to vector3
	distanceSortFunction = (a, b) => a.d - b.d;

	public reset(): void {
		this.left.reset();
		this.right.reset();
		this.intersection.reset();
	}

	public calculateIntersection(globe: Globe, preLookHelper: Group, isDebugMode: boolean) {
		if (this.left.valid && this.right.valid) {
			this.normal
				.copy(this.left.position)
				.cross(this.right.position)
				.normalize();

			this.left.toOther.copy(this.right.position).sub(this.left.position);
			this.right.toOther.copy(this.left.position).sub(this.right.position);

			const intersections = intersection(
				{ center: this.left.position, radius: this.left.allowedDistance },
				{ center: this.right.position, radius: this.right.allowedDistance },
				globe.radius
			);

			if (intersections.length > 0) {
				this.intersection.a.position.copy(intersections[0]);
				preLookHelper.lookAt(this.intersection.a.position);
				this.intersection.a.quaternion = preLookHelper.quaternion.clone();
				this.intersection.a.valid = true;

				if (isDebugMode) {
					globe.putPin('debugIntersectA').position.copy(this.intersection.a.position);
				}
			} else {
				this.intersection.a.valid = false;
			}

			if (intersections.length > 1) {
				this.intersection.b.position.copy(intersections[1]);
				preLookHelper.lookAt(this.intersection.b.position);
				this.intersection.b.quaternion = preLookHelper.quaternion.clone();
				this.intersection.b.valid = true;

				if (isDebugMode) {
					globe.putPin('debugIntersectB').position.copy(this.intersection.b.position);
				}
			} else {
				this.intersection.b.valid = false;
			}
		}
	}
}

export class ActorObject extends Basic {
	public geometry: SphereBufferGeometry;
	public material: MeshBasicMaterial;
	public lastWorldPosition = new Vector3();
	public baseHeight = 1.02;
	private scalarScale = 1;
	private scalarScaleBias = 0;
	// panning/distance restriction
	private positionAtStart: Quaternion;
	private positionHelper = new Vector3();
	private prelookHelper = new Group();
	private panFinishedSubject = new Subject<boolean>();
	private panEventSubject = new Subject<{ point: Vector3 }>();
	private panHelper = new PanHelper();

	private enclosing: Enclosing<Node<UnixWrapper, ActorDelta>>;
	private actorAccumulator$: Observable<Accumulator>;
	public constructor(
		public actor: RxDocument<Actor>,
		private storeFacade: StoreFacade,
		private loreService: LoreService,
		private actorService: ActorService,
		public globe: Globe
	) {
		super(new SphereBufferGeometry(0.02, 40, 40), undefined);
		this.material = new MeshBasicMaterial({
			color: 0x1a56e6
		});
		this.actorAccumulator$ = this.actorService.actorDeltasAtCursor$.pipe(
			map(accs => accs.find(acc => acc.actor.id === this.actor.id)),
			filter(acc => acc !== undefined),
			shareReplay(1)
		);
		this.actorAccumulator$.subscribe(next => {
			this.material.color.set(next.accumulator.color.value);
		});

		this.name = actor.id;
		this.type = 'Point';
		this.position.set(0, 0, this.baseHeight);
		this.rotateX(90 * ThreeMath.DEG2RAD);

		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method end enable fast raycasting, only works with Buffered Geometries

		this.addEventListener('panstart', this.onPanStart);
		/**
		 * While panning we have to stay between the enclosing nodes reaching distance
		 *
		 * the reaching distance is calculated by the enclosing nodes unixes and the current time
		 *
		 * Don't have to worry about whether the scene is playing or not, since the actor is in are in override mode
		 * while panning
		 * Time is divided by 3600 because the unix is in seconds and the speed is in km/h
		 *
		 * TODO: The first/last thing is switched, fix it in the AVL repo
		 */
		this.addEventListener('pan', event => {
			this.panEventSubject.next(event as any);
		});

		this.addEventListener('panend', event => {
			this.panFinishedSubject.next(true);
			// cursor override is only possible with the mouse,
			// and if you're panning this and not the cursor, it's fine to clear it here
			this.loreService.spawnOnWorld.next({ point: this, position: this.getWorldPosition(new Vector3()) });
			this.storeFacade.clearCursorOverride();
			this.positionAtStart = undefined;
			this.positionHelper.set(0, 0, 0);
			this.parent.userData.override = false;
			this.panHelper.reset();
			this.globe.indicatorFrom.doHide();
			this.globe.indicatorTo.doHide();
		});
		this.storeFacade.actorObjectSizeBias$.pipe(filter(next => next !== undefined)).subscribe(next => {
			this.scalarScaleBias = next;
			this.scale.setScalar(this.scalarScale + this.scalarScaleBias);
		});
	}

	public onPanStart(e: any): void {
		this.positionAtStart = this.parent.quaternion.clone();
		this.parent.userData.override = true; // Switched off in the LoreService
		combineLatest([
			this.storeFacade.isDebugMode$,
			combineLatest([this.actorAccumulator$, this.storeFacade.isDebugMode$]).pipe(
				tap(([next, isDebugMode]) => {
					// Prepare
					// Get the enclosing events that are defining the time and position
					this.enclosing = this.actor._states.enclosingNodes(new UnixWrapper(next.cursor));
					// If the cursor is right on a node, "go edit mode" and just select the node before and after as enclosing
					if (this.enclosing.first && this.enclosing.first.key.unix === next.cursor) {
						this.enclosing.first = this.actor._states.enclosingNodes(
							new UnixWrapper(next.cursor - 1)
						).first;
						this.enclosing.last = this.actor._states.enclosingNodes(new UnixWrapper(next.cursor + 1)).last;
					}
					// If there is an event in the past
					if (this.enclosing.first) {
						this.panHelper.left.setFromEvent(this.enclosing.first, this.globe, next, this.prelookHelper);
					}
					// If there is an event in the future
					if (this.enclosing.last) {
						this.panHelper.right.setFromEvent(this.enclosing.last, this.globe, next, this.prelookHelper);
					}

					// if there's both get the intersecting points
					if (this.enclosing.first && this.enclosing.last) {
						this.panHelper.calculateIntersection(this.globe, this.prelookHelper, isDebugMode);

						this.panHelper.progressFromFirst = ThreeMath.mapLinear(
							next.cursor,
							this.enclosing.first.key.unix,
							this.enclosing.last.key.unix,
							0,
							1
						);

						this.panHelper.lrDist = this.panHelper.left.position.angleTo(this.panHelper.right.position);
						if (isDebugMode) {
							this.globe.putArrowHelper(
								'debugLeftToOther',
								this.panHelper.left.position,
								this.panHelper.left.toOther
							);
							this.globe.putArrowHelper(
								'debugRightToOther',
								this.panHelper.right.position,
								this.panHelper.right.toOther
							);
						}
					}
				})
			),
			this.panEventSubject
		])
			.pipe(takeUntil(this.panFinishedSubject))
			.subscribe(([isDebugMode, next, event]) => {
				// const isDebugMode = false;
				// Actual panning
				// PREPARATION
				if (this.enclosing.first) {
					this.panHelper.left.preparePan(
						this.panHelper.intersection,
						event.point,
						this.globe,
						this.prelookHelper
					);
				}

				if (this.enclosing.last) {
					this.panHelper.right.preparePan(
						this.panHelper.intersection,
						event.point,
						this.globe,
						this.prelookHelper
					);
				}

				if (this.panHelper.intersection.a.valid) {
					this.panHelper.intersection.a.distanceP = this.panHelper.intersection.a.position.angleTo(
						event.point
					);
					this.panHelper.left.toIntA
						.copy(this.panHelper.intersection.a.position)
						.sub(this.panHelper.left.position);
					this.panHelper.right.toIntA
						.copy(this.panHelper.intersection.a.position)
						.sub(this.panHelper.right.position);

					if (isDebugMode) {
						this.globe.putArrowHelper(
							'debugLeftToIntA',
							this.panHelper.left.position,
							this.panHelper.left.toIntA,
							0xff0022
						);
						this.globe.putArrowHelper(
							'debugRightToIntA',
							this.panHelper.right.position,
							this.panHelper.right.toIntA,
							0xffbc00
						);
					}
				}
				if (this.panHelper.intersection.b.valid) {
					this.panHelper.intersection.b.distanceP = this.panHelper.intersection.b.position.angleTo(
						event.point
					);
					this.panHelper.left.toIntB
						.copy(this.panHelper.intersection.b.position)
						.sub(this.panHelper.left.position);
					this.panHelper.right.toIntB
						.copy(this.panHelper.intersection.b.position)
						.sub(this.panHelper.right.position);

					if (isDebugMode) {
						this.globe.putArrowHelper(
							'debugLeftToIntB',
							this.panHelper.left.position,
							this.panHelper.left.toIntB,
							0xff0101
						);
						this.globe.putArrowHelper(
							'debugRightToIntB',
							this.panHelper.right.position,
							this.panHelper.right.toIntB,
							0x00ff4e
						);
					}
				}

				if (this.panHelper.intersection.a.valid && this.panHelper.intersection.b.valid) {
					this.panHelper.intersection.abNorm
						.copy(this.panHelper.intersection.a.position)
						.cross(this.panHelper.intersection.b.position)
						.normalize();

					this.panHelper.intersection.abDist = this.panHelper.intersection.a.position.angleTo(
						this.panHelper.intersection.b.position
					);

					this.panHelper.intersection.center.copy(
						arcIntersection(
							this.panHelper.intersection.a.position,
							this.panHelper.intersection.b.position,
							this.panHelper.left.position,
							this.panHelper.right.position
						)
					);

					this.panHelper.left.toCenter
						.copy(this.panHelper.intersection.center)
						.sub(this.panHelper.left.position);
					this.panHelper.right.toCenter
						.copy(this.panHelper.intersection.center)
						.sub(this.panHelper.right.position);

					this.panHelper.left.toNearestAllowed
						.copy(this.panHelper.left.nearestAllowedPosition)
						.sub(this.panHelper.left.position);

					this.panHelper.right.toNearestAllowed
						.copy(this.panHelper.right.nearestAllowedPosition)
						.sub(this.panHelper.right.position);

					this.panHelper.left.angleBetweenOtherAndCenter = this.panHelper.left.toOther.angleTo(
						this.panHelper.left.toCenter
					);
					this.panHelper.right.angleBetweenOtherAndCenter = this.panHelper.right.toOther.angleTo(
						this.panHelper.right.toCenter
					);

					this.panHelper.left.iVect
						.copy(this.panHelper.intersection.center)
						.sub(this.panHelper.left.position);
					this.panHelper.right.iVect
						.copy(this.panHelper.intersection.center)
						.sub(this.panHelper.right.position);

					if (isDebugMode) {
						this.globe.putArrowHelper(
							'debugLeftToCenter',
							this.panHelper.left.position,
							this.panHelper.left.toCenter,
							0x00ff00
						);
						this.globe.putArrowHelper(
							'debugRightToCenter',
							this.panHelper.right.position,
							this.panHelper.right.toCenter,
							0x0000ff
						);

						this.globe.putArrowHelper(
							'debugLeftToNearestAllowed',
							this.panHelper.left.position,
							this.panHelper.left.toNearestAllowed,
							0xbeffb9
						);
						this.globe.putArrowHelper(
							'debugRightToNearestAllowed',
							this.panHelper.right.position,
							this.panHelper.right.toNearestAllowed,
							0x90c5ff
						);

						this.globe
							.putPin('debugIntersectCenter', '#4a00ff')
							.position.copy(this.panHelper.intersection.center);

						this.globe.putArrowHelper(
							'debugLeftIVect',
							this.panHelper.left.position,
							this.panHelper.left.iVect,
							0xff0000
						);
						this.globe.putArrowHelper(
							'debugRightIVect',
							this.panHelper.right.position,
							this.panHelper.right.iVect,
							0x9e00ff
						);
					}
				}

				// PREPARATION END

				// If the request is valid

				if (this.panHelper.left.valid && !this.panHelper.right.valid) {
					if (this.panHelper.left.allowedAngle >= this.panHelper.left.requestedAngle) {
						this.parent.lookAt(event.point);
					} else {
						this.parent.quaternion.copy(this.panHelper.left.nearestQuaternion);
					}
				} else if (!this.panHelper.left.valid && this.panHelper.right.valid) {
					if (this.panHelper.right.allowedAngle >= this.panHelper.right.requestedAngle) {
						this.parent.lookAt(event.point);
					} else {
						this.parent.quaternion.copy(this.panHelper.right.nearestQuaternion);
					}
				} else {
					// both valid

					if (
						this.panHelper.left.allowedAngle >= this.panHelper.left.requestedAngle &&
						this.panHelper.right.allowedAngle >= this.panHelper.right.requestedAngle
					) {
						this.parent.lookAt(event.point);
					} else if (this.panHelper.intersection.a.valid && !this.panHelper.intersection.b.valid) {
						this.parent.quaternion.copy(this.panHelper.intersection.a.quaternion);
					} else if (!this.panHelper.intersection.a.valid && !this.panHelper.intersection.b.valid) {
						// Either
						// Circle inside the circle
						if (
							this.panHelper.lrDist + this.panHelper.left.allowedAngle <=
							this.panHelper.right.allowedAngle
						) {
							this.parent.quaternion.copy(this.panHelper.left.nearestQuaternion);
						} else if (
							this.panHelper.lrDist + this.panHelper.right.allowedAngle <=
							this.panHelper.left.allowedAngle
						) {
							this.parent.quaternion.copy(this.panHelper.right.nearestQuaternion);
						} else {
							// or outside each other but the single intersection not calculated correctly then jump between them
							this.positionHelper
								.copy(this.panHelper.left.position)
								.applyAxisAngle(
									this.panHelper.normal,
									this.panHelper.progressFromFirst * this.panHelper.lrDist
								);
							this.parent.lookAt(this.positionHelper);
						}
					} else {
						// If neither requirement is met and there is two intersecting points
						const leftIsOnIntArc = this.panHelper.left.isOnCorrectArc();
						const rightIsOnIntArc = this.panHelper.right.isOnCorrectArc();

						this.panHelper.distanceSorter[0].d = leftIsOnIntArc
							? Math.abs(this.panHelper.left.missingAngle)
							: Infinity;
						this.panHelper.distanceSorter[0].q = this.panHelper.left.nearestQuaternion;

						this.panHelper.distanceSorter[1].d = rightIsOnIntArc
							? Math.abs(this.panHelper.right.missingAngle)
							: Infinity;
						this.panHelper.distanceSorter[1].q = this.panHelper.right.nearestQuaternion;

						this.panHelper.distanceSorter[2].d = this.panHelper.intersection.a.distanceP;
						this.panHelper.distanceSorter[2].q = this.panHelper.intersection.a.quaternion;

						this.panHelper.distanceSorter[3].d = this.panHelper.intersection.b.distanceP;
						this.panHelper.distanceSorter[3].q = this.panHelper.intersection.b.quaternion;

						this.parent.quaternion.copy(
							this.panHelper.distanceSorter.sort(this.panHelper.distanceSortFunction)[0].q
						);
					}
				}

				this.updateHeightAndWorldPosAndScale();
			});
	}

	public updateHeightAndWorldPosAndScale(scalarScale?: number): void {
		if (this.parent) {
			this.parent.updateWorldMatrix(false, true);
		}
		if (scalarScale) {
			this.scalarScale = scalarScale;
		}
		this.scale.setScalar(Math.max(this.scalarScale + this.scalarScaleBias, 0.2));
		this.updateHeight();
	}

	public updateHeight(): void {
		const engineService = this.stage.engineService;
		const globe = this.parent.parent as Globe;
		const worldPos = this.getWorldPosition(this.lastWorldPosition);
		worldPos.multiplyScalar(1.1); // Look start further away;
		const toCenter = worldPos
			.clone()
			.multiplyScalar(-1)
			.normalize();
		engineService.raycaster.set(worldPos, toCenter);

		const i = engineService.raycaster.intersectObject(globe)[0];
		if (i) {
			//  but there's always be an intersection as the globe is spherical
			const displacementHere = globe.displacementTexture.heightAt(i.uv);
			this.position.set(
				0,
				0,
				this.baseHeight + displacementHere * globe.displacementScale + globe.displacementBias
			);
		}
	}
}

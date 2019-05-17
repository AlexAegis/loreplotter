import { Enclosing, Node } from '@alexaegis/avl';
import { arcIntersection } from '@app/function/arc-intersect.function';
import { intersection } from '@app/function/intersection.function';
import { Actor, ActorDelta, UnixWrapper } from '@app/model/data';
import { ActorAccumulator, ActorService, LoreService } from '@app/service';
import { Pin } from '@lore/engine/object/pin.class';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDocument } from 'rxdb';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, shareReplay, takeUntil, tap } from 'rxjs/operators';
import { Group, Math as ThreeMath, MeshBasicMaterial, Quaternion, SphereBufferGeometry, Vector3 } from 'three';
import { Basic } from './basic.class';
import { Globe } from './globe.class';


export class IntersectionHelper {
	left = new EventHelper();
	right = new EventHelper();
	time = Infinity;
	normal = new Vector3();
	lrDist = Infinity;
	intersection = {
		a: {
			postition: new Vector3(),
			quaternion: new Quaternion(),
			distanceP: Infinity,
			valid: false
		},
		b: {
			postition: new Vector3(),
			quaternion: new Quaternion(),
			distanceP: Infinity,
			valid: false
		},
		abDist: Infinity,
		abNorm: new Vector3(),
		center: new Vector3()
	};

	public reset(): void {
		this.left.reset();
		this.right.reset();
		this.intersection.a.valid = false;
		this.intersection.b.valid = false;
	}

	public calculateIntersection(globe: Globe, preLookHelper: Group) {
		if (this.left.valid && this.right.valid) {
			this.normal
				.copy(this.left.position)
				.cross(this.right.position);

			this.left.toOther
				.copy(this.right.position)
				.sub(this.left.position);
			this.right.toOther
				.copy(this.left.position)
				.sub(this.right.position);

			const intersections = intersection(
				{ center: this.left.position, radius: this.left.allowedDistance },
				{ center: this.right.position, radius: this.right.allowedDistance },
				globe.radius
			);

			let intersectA = globe.getObjectByName('intersectA');
			let intersectB = globe.getObjectByName('intersectB');

			// TODO remove Pins
			if (intersectA === undefined) {
				intersectA = new Pin('intersectA', '#00ff95');
				globe.add(intersectA);
			}
			if (intersectB === undefined) {
				intersectB = new Pin('intersectB', '#00e9ff');
				globe.add(intersectB);
			}

			if (intersections.length > 0) {
				this.intersection.a.postition.copy(intersections[0]);
				intersectA.position.copy(this.intersection.a.postition);
				preLookHelper.lookAt(this.intersection.a.postition);
				this.intersection.a.quaternion = preLookHelper.quaternion.clone();
				this.intersection.a.valid = true;
			} else {
				this.intersection.a.valid = false;
			}

			if (intersections.length > 1) {
				this.intersection.b.postition.copy(intersections[1]);
				intersectB.position.copy(this.intersection.b.postition);
				preLookHelper.lookAt(this.intersection.b.postition);
				this.intersection.b.quaternion = preLookHelper.quaternion.clone();
				this.intersection.b.valid = true;
			} else {
				this.intersection.b.valid = false;
			}

			console.log('this.intersection: ', this.intersection);
		}

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
	toOther = new Vector3();
	angleBetweenOtherAndCenter = Infinity; // If bigger than PI/2 then the bigger arc is on the intersection
	valid = false;


	public setFromEvent(event: Node<UnixWrapper, ActorDelta>, globe: Globe, next: ActorAccumulator, preLookHelper: Group): void {
		this.position.copy(event.value.position as Vector3);
		this.time = Math.abs(event.key.unix - next.cursor);
		this.allowedDistance =
			(this.time / 3600) * next.accumulator.maxSpeed;
		this.allowedAngle = this.allowedDistance / globe.radius;

		if (next.cursor > event.key.unix) { // future
			globe.indicatorFrom.setTargetRadian(this.allowedAngle);
			globe.indicatorFrom.parent.lookAt(this.position);
			globe.indicatorFrom.doShow();
		} else { // past
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
}


export class ActorObject extends Basic {
	public geometry: SphereBufferGeometry;
	public material: MeshBasicMaterial;
	public lastWorldPosition = new Vector3();
	public baseHeight = 1.025;
	private scalarScale = 1;
	private scalarScaleBias = 0;
	// panning/distance restriction
	private positionAtStart: Quaternion;
	private positionHelper = new Vector3();
	private prelookHelper = new Group();
	private panFinishedSubject = new Subject<boolean>();
	private panEventSubject = new Subject<{ point: Vector3 }>();
	private panHelper = new IntersectionHelper();

	private enclosing: Enclosing<Node<UnixWrapper, ActorDelta>>;
	private actorAccumulator$: Observable<ActorAccumulator>;
	public constructor(
		public actor: RxDocument<Actor>,
		private storeFacade: StoreFacade,
		private loreService: LoreService,
		private actorService: ActorService,
		public globe: Globe
	) {
		super(new SphereBufferGeometry(0.04, 40, 40), undefined);
		this.material = new MeshBasicMaterial({
			color: 0x1a56e6
		});
		this.actorAccumulator$ = this.actorService.actorDeltasAtCursor$.pipe(
			map(accs => accs.find(acc => acc.actor.id === this.actor.id)),
			filter(acc => acc !== undefined),
			shareReplay(1)
		);
		this.actorAccumulator$.subscribe(next => {
			this.material.color.set(next.accumulator.color);
		});

		this.name = actor.id;
		this.type = 'Point';
		this.position.set(0, 0, this.baseHeight);
		this.rotateX(90 * ThreeMath.DEG2RAD);

		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method end enable fast raycasting, only works with Buffered Geometries

		this.addEventListener('panstart', e => {
			this.positionAtStart = this.parent.quaternion.clone();
			this.parent.userData.override = true; // Switched off in the LoreService
			combineLatest([
				this.actorAccumulator$.pipe(
					tap(next => {
						// Prepare
						// Get the enclosing events that are defining the time and position
						this.enclosing = this.actor._states.enclosingNodes(new UnixWrapper(next.cursor));
						// If the cursor is right on a node, "go edit mode" and just select the node before and after as enclosing
						if (this.enclosing.first && this.enclosing.first.key.unix === next.cursor) {
							this.enclosing.first = this.actor._states.enclosingNodes(
								new UnixWrapper(next.cursor - 1)
							).first;
							this.enclosing.last = this.actor._states.enclosingNodes(
								new UnixWrapper(next.cursor + 1)
							).last;
						}
						// If there is an event in the past
						if (this.enclosing.first) {
							this.panHelper.left.setFromEvent(this.enclosing.first, this.globe, next, this.prelookHelper);
						}
						// If there is an event in the future
						if (this.enclosing.last) {
							this.panHelper.right.setFromEvent(this.enclosing.last, this.globe, next, this.prelookHelper);
						}

						// get the intersecting points
						if (this.enclosing.first && this.enclosing.last) {
							this.panHelper.calculateIntersection(this.globe, this.prelookHelper);
						}
					})
				),
				this.panEventSubject
			])
				.pipe(takeUntil(this.panFinishedSubject))
				.subscribe(([next, event]) => {
					// Actual panning
					// PREPARATION
					if (this.enclosing.first) {
						this.panHelper.left.requestedAngle = this.panHelper.left.position.angleTo(event.point);
						this.panHelper.left.missingAngle =
							this.panHelper.left.requestedAngle - this.panHelper.left.allowedAngle;
						this.panHelper.left.normToPointer
							.copy(this.panHelper.left.position)
							.cross(event.point)
							.normalize();
						this.panHelper.left.nearestAllowedPosition
							.copy(this.panHelper.left.position)
							.applyAxisAngle(this.panHelper.left.normToPointer, this.panHelper.left.allowedAngle);
						this.panHelper.left.requestedDistance = this.panHelper.left.requestedAngle * this.globe.radius; // TODO: Ditch
						this.prelookHelper.lookAt(this.panHelper.left.nearestAllowedPosition); // TODO: Ditch
						this.panHelper.left.nearestQuaternion = this.prelookHelper.quaternion.clone(); // TODO: Ditch
						if (this.panHelper.intersection.a.valid) {
							this.panHelper.left.intADist = this.panHelper.left.position.angleTo(
								this.panHelper.intersection.a.postition
							);
						}
						if (this.panHelper.intersection.b.valid) {
							this.panHelper.left.intBDist = this.panHelper.left.position.angleTo(
								this.panHelper.intersection.b.postition
							);
						}
					}

					if (this.enclosing.last) {
						this.panHelper.right.requestedAngle = this.panHelper.right.position.angleTo(event.point);
						this.panHelper.right.missingAngle =
							this.panHelper.right.requestedAngle - this.panHelper.right.allowedAngle;
						this.panHelper.right.normToPointer
							.copy(this.panHelper.right.position)
							.cross(event.point)
							.normalize();
						this.panHelper.right.nearestAllowedPosition
							.copy(this.panHelper.left.position)
							.applyAxisAngle(this.panHelper.right.normToPointer, this.panHelper.right.allowedAngle);
						this.panHelper.right.requestedDistance = this.panHelper.left.requestedAngle * this.globe.radius; // TODO: Ditch
						this.prelookHelper.lookAt(this.panHelper.right.nearestAllowedPosition); // TODO: Ditch
						this.panHelper.right.nearestQuaternion = this.prelookHelper.quaternion.clone(); // TODO: Ditch
						if (this.panHelper.intersection.a.valid) {
							this.panHelper.right.intADist = this.panHelper.right.position.angleTo(
								this.panHelper.intersection.a.postition
							);
						}
						if (this.panHelper.intersection.b.valid) {
							this.panHelper.right.intBDist = this.panHelper.right.position.angleTo(
								this.panHelper.intersection.b.postition
							);
						}
					}

					if (this.panHelper.intersection.a.valid) {
						this.panHelper.intersection.a.distanceP = this.panHelper.intersection.a.postition.angleTo(event.point);
						this.panHelper.left.toIntA
							.copy(this.panHelper.intersection.a.postition)
							.sub(this.panHelper.left.position);
						this.panHelper.right.toIntA
							.copy(this.panHelper.intersection.a.postition)
							.sub(this.panHelper.right.position);
					}
					if (this.panHelper.intersection.b.valid) {
						this.panHelper.intersection.b.distanceP = this.panHelper.intersection.b.postition.angleTo(event.point);
						this.panHelper.left.toIntB
							.copy(this.panHelper.intersection.b.postition)
							.sub(this.panHelper.left.position);
						this.panHelper.right.toIntB
							.copy(this.panHelper.intersection.b.postition)
							.sub(this.panHelper.right.position);
					}

					if (this.panHelper.intersection.a.valid && this.panHelper.intersection.b.valid) {
						this.panHelper.intersection.abNorm
							.copy(this.panHelper.intersection.a.postition)
							.cross(this.panHelper.intersection.b.postition);

						this.panHelper.intersection.abDist = this.panHelper.intersection.a.postition.angleTo(this.panHelper.intersection.b.postition);
						/*this.intersection.flatCenter
							.copy(this.intersection.a.postition)
							.sub(this.intersection.b.postition)
							.multiplyScalar(0.5)
							.sub(this.panHelper.left.position);*/

						this.panHelper.intersection.center
							.copy(this.panHelper.intersection.a.postition)
							.applyAxisAngle(this.panHelper.intersection.abNorm, this.panHelper.intersection.abDist / 2);

						this.panHelper.left.toCenter.copy(this.panHelper.intersection.center).sub(this.panHelper.left.position);
						this.panHelper.right.toCenter.copy(this.panHelper.intersection.center).sub(this.panHelper.right.position);

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

						console.log('LeftCenterAngle: ' + this.panHelper.left.angleBetweenOtherAndCenter);
						console.log('RightCenterAngle: ' + this.panHelper.right.angleBetweenOtherAndCenter);

						let intersectCenterPin = this.globe.getObjectByName('intersectCenter');

						// TODO remove Pins
						if (intersectCenterPin === undefined) {
							intersectCenterPin = new Pin('intersectCenter', '#4a00ff');
							this.globe.add(intersectCenterPin);
						}
						intersectCenterPin.position.copy(this.panHelper.intersection.center);

						this.panHelper.left.iVect.copy(this.panHelper.intersection.center).sub(this.panHelper.left.position);
						this.panHelper.right.iVect.copy(this.panHelper.intersection.center).sub(this.panHelper.right.position);
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

						console.log(
							'left allowed: ',
							this.panHelper.left.allowedAngle,
							' left req: ',
							this.panHelper.left.requestedAngle
						);
						console.log(
							'right allowed: ',
							this.panHelper.right.allowedAngle,
							' right req: ',
							this.panHelper.right.requestedAngle
						);
						if (
							this.panHelper.left.allowedAngle >= this.panHelper.left.requestedAngle &&
							this.panHelper.right.allowedAngle >= this.panHelper.right.requestedAngle
						) {
							console.log('This is fine');
							this.parent.lookAt(event.point);
						} else if (this.panHelper.intersection.a.valid && !this.panHelper.intersection.b.valid) {
							console.log('!!!!!!!!!!SINGLE INTERSECTION!!');
							this.parent.quaternion.copy(this.panHelper.intersection.a.quaternion);
						} else if (!this.panHelper.intersection.a.valid && !this.panHelper.intersection.b.valid) {
							console.log('!!!!!!!!!!!!!4NO INTERSECTION!!');

							// Either
							// Circle inside the circle

							if (
								this.panHelper.lrDist + this.panHelper.left.allowedAngle <=
								this.panHelper.right.allowedAngle ||
								this.panHelper.lrDist + this.panHelper.right.allowedAngle <=
								this.panHelper.left.allowedAngle
							) {
								console.log('!!!!!!!!!!!!!4CIRC IN CIRC!!');
								if (this.panHelper.left.requestedAngle >= this.panHelper.right.requestedAngle) {
									this.parent.quaternion.copy(this.panHelper.left.nearestQuaternion);
								} else {
									this.parent.quaternion.copy(this.panHelper.right.nearestQuaternion);
								}
							} else {
								// or outside each other but the single intersection not calculated correctly then jump between them
								console.log('!!!!!!!!!!!!!SEPARATE!!!!');

								// TODO Problems
								this.positionHelper
									.copy(this.panHelper.left.position)
									.applyAxisAngle(this.panHelper.normal, this.panHelper.left.allowedAngle);

								this.parent.lookAt(this.positionHelper);
							}
						} else {
							// If neither requirement is met and there is two intersecting points

							console.log('int: ', this.panHelper.intersection);
							console.log('near left: ', this.panHelper.left.nearestQuaternion);
							console.log('near right: ', this.panHelper.right.nearestQuaternion);

							const abIntLeft = arcIntersection(
								this.panHelper.intersection.a.postition,
								this.panHelper.intersection.b.postition,
								event.point,
								this.panHelper.left.position
							).normalize();// TODO Ditch
							const abIntRight = arcIntersection(
								this.panHelper.intersection.a.postition,
								this.panHelper.intersection.b.postition,
								event.point,
								this.panHelper.right.position
							).normalize(); // TODO Ditch


							const leftIntAIntBAngle = this.panHelper.left.toIntA.angleTo(this.panHelper.left.toIntB);
							const leftIntANearestAngle = this.panHelper.left.toIntA.angleTo(this.panHelper.left.nearestAllowedPosition);
							const leftIntBNearestAngle = this.panHelper.left.toIntB.angleTo(this.panHelper.left.nearestAllowedPosition);
							const leftArcDifference = Math.abs(leftIntANearestAngle + leftIntBNearestAngle - leftIntAIntBAngle);
							const leftNearestIsInSmallerArc = leftArcDifference <= 0.001;
							const leftIsOnIntArc = this.panHelper.left.angleBetweenOtherAndCenter < Math.PI / 2 ? leftNearestIsInSmallerArc : !leftNearestIsInSmallerArc;


							const rightIntAIntBAngle = this.panHelper.right.toIntA.angleTo(this.panHelper.right.toIntB);
							const rightIntANearestAngle = this.panHelper.right.toIntA.angleTo(this.panHelper.right.nearestAllowedPosition);
							const rightIntBNearestAngle = this.panHelper.right.toIntB.angleTo(this.panHelper.right.nearestAllowedPosition);
							const rightArcDifference = Math.abs(rightIntANearestAngle + rightIntBNearestAngle - rightIntAIntBAngle);
							const rightNearestIsInSmallerArc = rightArcDifference <= 0.001;
							const rightIsOnIntArc = this.panHelper.right.angleBetweenOtherAndCenter < Math.PI / 2 ? rightNearestIsInSmallerArc : !rightNearestIsInSmallerArc;

							console.log('leftArcDifference: ' + leftArcDifference);
							console.log('rightArcDifference: ' + rightArcDifference);


							const distLeftToRight = this.panHelper.left.quaternion.angleTo(
								this.panHelper.right.quaternion
							);

							const leftIntInnerDistDiff = Math.abs(
								this.panHelper.left.intADist + this.panHelper.left.intBDist - this.panHelper.intersection.abDist
							);
							const rightIntInnerDistDiff = Math.abs(
								this.panHelper.right.intADist + this.panHelper.right.intBDist - this.panHelper.intersection.abDist
							);

							console.log(
								`leftIntInnerDistDiff: ${leftIntInnerDistDiff}, rightIntInnerDistDiff: ${rightIntInnerDistDiff}`
							);

							const leftInside = leftIntInnerDistDiff <= 0.001;
							const rightInside = rightIntInnerDistDiff <= 0.001;

							console.log(`leftInside: ${leftInside} rightInside: ${rightInside}`);

							// const leftOnArc = leftInside && leftCenterDist >= distPtoIntLeft;
							// const rightOnArc = rightInside && rightCenterDist >= distPtoIntRight;

							const leftOnArc = leftInside; // OR NOT JSUT INSIDE BUT WHEN THE distance between main circles is less than the distance to the intersection line
							const rightOnArc = rightInside;
							console.log(`leftOnArc: ${leftOnArc} rightOnArc: ${rightOnArc}`);
							/*	if (!leftInside && !rightInside) {
								this.parent.quaternion.copy(aDist < bDist ? this.intersectionA : this.intersectionB);
							} else {
								this.parent.quaternion.copy(
									leftNearestDist > rightNearestDist
										? this.panHelper.left.nearestQuaternion
										: this.panHelper.right.nearestQuaternion
								);
							}*/

							this.parent.quaternion.copy(
								[
									{
										d: leftIsOnIntArc ? this.panHelper.left.missingAngle : Infinity,
										q: this.panHelper.left.nearestQuaternion
									},
									{
										d: rightIsOnIntArc ? this.panHelper.right.missingAngle : Infinity,
										q: this.panHelper.right.nearestQuaternion
									},
									{ d: this.panHelper.intersection.a.distanceP, q: this.panHelper.intersection.a.quaternion },
									{ d: this.panHelper.intersection.b.distanceP, q: this.panHelper.intersection.b.quaternion }
								].sort((a, b) => a.d - b.d)[0].q
							);

							//this.parent.quaternion.copy(this.panHelper.left.nearestQuaternion);
							//} else if(Math.abs(distAtoIntRight + distBtoIntRight - distAtoB) <= 0.0001) {
							//	this.parent.quaternion.copy(this.panHelper.right.nearestQuaternion);
							/*} else if(!leftInside && rightInside) {
								this.parent.quaternion.copy(this.panHelper.left.nearestQuaternion);

							} else if(leftInside && !rightInside) {
								this.parent.quaternion.copy(this.panHelper.right.nearestQuaternion);

	*/

							/*

							if (Math.abs(distAtoIntLeft + distBtoIntLeft - distAtoB) >= 0.001 || Math.abs(distAtoIntRight + distBtoIntRight - distAtoB) >= 0.001) {
								this.parent.quaternion.copy(aDist < bDist ? this.intersectionA : this.intersectionB);
							} else {
								this.parent.quaternion.copy(
									leftNearestDist > rightNearestDist
										? this.panHelper.left.nearestQuaternion
										: this.panHelper.right.nearestQuaternion
								);
							}
	*/
							console.log('abInt: ', abIntLeft, abIntRight);

							// TODO remove Pins

							let abIntLeftPin = this.globe.getObjectByName('abIntLeftPin');
							let abIntRightPin = this.globe.getObjectByName('abIntRightPin');

							if (abIntLeftPin === undefined) {
								abIntLeftPin = new Pin('abIntLeftPin');
								this.globe.add(abIntLeftPin);
							}
							if (abIntRightPin === undefined) {
								abIntRightPin = new Pin('abIntRightPin');
								this.globe.add(abIntRightPin);
							}

							abIntLeftPin.position.copy(abIntLeft);
							abIntRightPin.position.copy(abIntRight);
						}
					}

					this.updateHeightAndWorldPosAndScale();

					// if both available
					if (this.enclosing.first && this.enclosing.last) {
					} else {
					}

					/*

					if (
						this.panHelper.left.allowedDistance >= this.panHelper.left.requestedDistance &&
						this.panHelper.right.allowedDistance >= this.panHelper.right.requestedDistance
					) {
						this.parent.lookAt(event.point);
						this.updateHeightAndWorldPosAndScale();
					} else {
						const firstRequest = destinationAngle.clone();

						// FIRST SNAP TO THE CLOSER ONE
						const snapToCloser =
							this.panHelper.left.requestedDistance <= this.panHelper.right.requestedDistance
								? this.panHelper.left
								: this.panHelper.right;
						let secondRequest: Quaternion = firstRequest.clone();
						// Only when needed and can
						if (
							snapToCloser.allowedDistance <= snapToCloser.requestedDistance &&
							snapToCloser.quaternion !== undefined
						) {
							const t = ThreeMath.mapLinear(
								snapToCloser.allowedDistance,
								0,
								snapToCloser.requestedDistance,
								0,
								1
							);
							Quaternion.slerp(snapToCloser.quaternion, firstRequest, this.parent.quaternion, t);
							this.updateHeightAndWorldPosAndScale();
							secondRequest = this.parent.quaternion.clone();
						}
						// THEN SNAP TO THE OTHER ONE
						const snapToOther =
							this.panHelper.left.requestedDistance > this.panHelper.right.requestedDistance
								? this.panHelper.left
								: this.panHelper.right;
						const secondAnchorAngleDiff = quaternionAngle(
							snapToOther.quaternion || (snapToCloser.quaternion && snapToCloser.quaternion.clone()),
							secondRequest.clone()
						);
						const secondRequestedDistance = secondAnchorAngleDiff * this.globe.radius;

						// Only when needed and can
						if (
							snapToOther.allowedDistance <= secondRequestedDistance &&
							snapToOther.quaternion !== undefined
						) {
							const t = ThreeMath.mapLinear(
								snapToOther.allowedDistance,
								0,
								secondRequestedDistance,
								0,
								1
							);
							Quaternion.slerp(snapToOther.quaternion, secondRequest, this.parent.quaternion, t);
							this.updateHeightAndWorldPosAndScale();
						}
					}*/
				});
		});
		/**
		 * While panning we have to stay between the enclosing nodes reaching distance
		 *
		 * the reaching distance is calculated by the enclosing nodes unixes and the current time
		 *
		 * Don't have to worry about whether the scene is playing or not, since the actor is in are in override mode
		 * while panning
		 * Time is divided by 3600 because the unix is in seconds and the speed is in km/h
		 *
		 * TODO: You have to distanceProtect Not just while panning, but while block/node panning
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
			// this.panHelper.left.requestedDistance = Infinity;
			// this.panHelper.left.requestedAngle = Infinity;
			// this.panHelper.left.allowedDistance = Infinity;
			// this.panHelper.left.time = Infinity;
			// this.panHelper.left.quaternion = undefined;
			// this.panHelper.left.nearestQuaternion = undefined;
			// this.panHelper.left.intADist = Infinity;
			// this.panHelper.left.intBDist = Infinity;
			// this.panHelper.left.valid = false;
			// this.panHelper.right.requestedDistance = Infinity;
			// this.panHelper.right.requestedAngle = Infinity;
			// this.panHelper.right.allowedDistance = Infinity;
			// this.panHelper.right.time = Infinity;
			// this.panHelper.right.quaternion = undefined;
			// this.panHelper.right.nearestQuaternion = undefined;
			// this.panHelper.right.intADist = Infinity;
			// this.panHelper.right.intBDist = Infinity;
			// this.panHelper.right.valid = false;
			// this.panHelper.lrDist = Infinity;
			// this.enclosing = undefined;
			// this.panHelper.intersection.a.valid = false;
			// this.panHelper.intersection.b.valid = false;
			this.globe.indicatorFrom.doHide();
			this.globe.indicatorTo.doHide();
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

		this.storeFacade.actorObjectSizeBias$.pipe(filter(next => next !== undefined)).subscribe(next => {
			this.scalarScaleBias = next;
			this.scale.setScalar(this.scalarScale + this.scalarScaleBias);
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
		// console.log(worldPos);
		worldPos.multiplyScalar(1.1); // Look start further away;
		const toCenter = worldPos
			.clone()
			.multiplyScalar(-1)
			.normalize();
		engineService.raycaster.set(worldPos, toCenter);

		// engineService.raycaster.setFromCamera(Axis.center, engineService.stage.camera);
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

	/**
	 *    public updateHeight(): void {
		const engineService = this.stage.engineService;
		const globe = this.parent as Globe;
		// console.log(worldPos);
		this.position.multiplyScalar(1.1); // Look start further away;
		const toCenter = this.position
			.clone()
			.multiplyScalar(-1)
			.normalize();
		engineService.raycaster.set(this.position, toCenter);

		// engineService.raycaster.setFromCamera(Axis.center, engineService.stage.camera);
		const i = engineService.raycaster.intersectObject(globe)[0];
		if (i) {
			//  but there's always be an intersection as the globe is spherical
			const displacementHere = globe.displacementTexture.heightAt(i.uv);
			this.position.setScalar(
				this.baseHeight + displacementHere * globe.displacementScale + globe.displacementBias
			);
		}
	}
	 */
}

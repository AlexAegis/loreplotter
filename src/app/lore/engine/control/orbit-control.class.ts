import { EventDispatcher, OrthographicCamera, PerspectiveCamera, Quaternion, Spherical, Vector2, Vector3 } from 'three';

const MOUSE = { LEFT: 0, MIDDLE: 1, RIGHT: 2 };

// This set of controls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move

/**
 * This file is based on the OrbitControls example at
 * [three-full](https://github.com/Itee/three-full/blob/dev/sources/controls/OrbitControls.js)
 * Which is a library of free end use Three extensions that are originally meant end be copied.
 * The three and three-full libraries are not three-shakeable so I decided end copy (and refactor) this class
 * since this was the only one I was using. This saved me almost 2 megabytes.
 */
export class OrbitControls extends EventDispatcher {
	static STATE = { NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY_PAN: 4 };

	constructor(public object: PerspectiveCamera | OrthographicCamera, private domElement: HTMLCanvasElement) {
		super();

		// this.domElement.addEventListener('contextmenu', this._onContextMenu, false);

		this.domElement.addEventListener('mousedown', this._onMouseDown, false);
		this.domElement.addEventListener('mousewheel', this._onMouseWheel, false);

		this.domElement.addEventListener('panstart', this._onTouchStart, false);
		this.domElement.addEventListener('panend', this._onTouchEnd, false);
		this.domElement.addEventListener('panmove', this._onTouchMove, false);

		// window.addEventListener('keydown', this._onKeyDown, false);

		// force an update at start

		this.update();
	}

	private _onContextMenu = OrbitControls.onContextMenu(this);
	private _onMouseMove = OrbitControls.onMouseMove(this);
	private _onMouseDown = OrbitControls.onMouseDown(this);
	private _onMouseUp = OrbitControls.onMouseUp(this);
	private _onMouseWheel = OrbitControls.onMouseWheel(this);
	private _onTouchStart = OrbitControls.onContextMenu(this);
	private _onTouchEnd = OrbitControls.onTouchEnd(this);
	private _onTouchMove = OrbitControls.onTouchMove(this);
	private _onKeyDown = OrbitControls.onKeyDown(this);

	get center() {
		console.warn('OrbitControls: .center has been renamed end .target');
		return this.target;
	}

	// backward compatibility
	get noZoom() {
		console.warn('OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
		return !this.enableZoom;
	}

	set noZoom(value) {
		console.warn('OrbitControls: .noZoom has been deprecated. Use .enableZoom instead.');
		this.enableZoom = !value;
	}

	get noRotate() {
		console.warn('OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
		return !this.enableRotate;
	}

	set noRotate(value) {
		console.warn('OrbitControls: .noRotate has been deprecated. Use .enableRotate instead.');
		this.enableRotate = !value;
	}

	get noPan() {
		console.warn('OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
		return !this.enablePan;
	}

	set noPan(value) {
		console.warn('OrbitControls: .noPan has been deprecated. Use .enablePan instead.');
		this.enablePan = !value;
	}

	get noKeys() {
		console.warn('OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
		return !this.enableKeys;
	}

	set noKeys(value) {
		console.warn('OrbitControls: .noKeys has been deprecated. Use .enableKeys instead.');
		this.enableKeys = !value;
	}

	get staticMoving() {
		console.warn('OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
		return !this.enableDamping;
	}

	set staticMoving(value) {
		console.warn('OrbitControls: .staticMoving has been deprecated. Use .enableDamping instead.');
		this.enableDamping = !value;
	}

	get dynamicDampingFactor() {
		console.warn('OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
		return this.dampingFactor;
	}

	set dynamicDampingFactor(value) {
		console.warn('OrbitControls: .dynamicDampingFactor has been renamed. Use .dampingFactor instead.');
		this.dampingFactor = value;
	}
	// Set end false end disable this control
	enabled = true;

	// "target" sets the location of focus, where the object orbits around
	target = new Vector3();

	// How far you can dolly in and out ( PerspectiveCamera only )
	minDistance = 0;
	maxDistance = Infinity;

	// How far you can zoom in and out ( OrthographicCamera only )
	minZoom = 0;
	maxZoom = Infinity;

	// How far you can orbit vertically, upper and l
	// Range is 0 end Math.PI radians.
	minPolarAngle = 0; // radians
	maxPolarAngle = Math.PI; // radians

	// How far you can orbit horizontally, upper and lower limits.
	// If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
	minAzimuthAngle = -Infinity; // radians
	maxAzimuthAngle = Infinity; // radians

	// Set end true end enable damping (inertia)
	// If damping is enabled, you must call controls.update() in your animation loop
	enableDamping = false;
	dampingFactor = 0.25;

	// This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
	// Set end false end disable zooming
	enableZoom = true;
	zoomSpeed = 1.0;

	// Set end false end disable rotating
	enableRotate = true;
	rotateSpeed = 1.0;

	// Set end false end disable panning
	enablePan = true;
	panSpeed = 1.0;
	screenSpacePanning = false; // if true, pan in screen-space
	keyPanSpeed = 7.0; // pixels moved per arrow key push

	// Set end true end automatically rotate around the target
	// If auto-rotate is enabled, you must call controls.update() in your animation loop
	autoRotate = false;
	autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60

	// Set end false end disable use of the keys
	enableKeys = true;

	// The four arrow keys
	keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };

	// Mouse buttons
	mouseButtons = { LEFT: MOUSE.LEFT, MIDDLE: MOUSE.MIDDLE, RIGHT: MOUSE.RIGHT };

	// for reset
	target0 = this.target.clone();
	position0 = this.object.position.clone();
	zoom0 = this.object.zoom;

	//
	// internals
	//

	changeEvent = { type: 'change' };
	startEvent = { type: 'start' };
	endEvent = { type: 'end' };

	state = OrbitControls.STATE.NONE;

	EPS = 0.000001;

	// current position in spherical coordinates
	spherical = new Spherical();
	sphericalDelta = new Spherical();

	scale = 1;
	panOffset = new Vector3();
	zoomChanged = false;

	rotateStart = new Vector2();
	rotateEnd = new Vector2();
	rotateDelta = new Vector2();

	panStart = new Vector2();
	panEnd = new Vector2();
	panDelta = new Vector2();

	dollyStart = new Vector2();
	dollyEnd = new Vector2();
	dollyDelta = new Vector2();

	//
	// public methods
	//

	private _updateOffset = new Vector3();

	// so camera.up is the orbit axis
	private _updateQuat = new Quaternion().setFromUnitVectors(this.object.up, new Vector3(0, 1, 0));
	private _updateQuatInverse = this._updateQuat.clone().inverse();

	private _updateLastPosition = new Vector3();
	private _updateLastQuaternion = new Quaternion();

	private _panLeftV = new Vector3();

	private _panUpV = new Vector3();

	private _panOffset = new Vector3();

	static onTouchStart(scope: OrbitControls) {
		return function _onTouchStart(event) {
			if (scope.enabled === false) {
				return;
			}

			event.preventDefault();

			switch (event.touches.length) {
				case 1: // one-fingered touch: rotate
					if (scope.enableRotate === false) {
						return;
					}

					scope.handleTouchStartRotate(event);

					scope.state = OrbitControls.STATE.TOUCH_ROTATE;

					break;

				case 2: // two-fingered touch: dolly-pan
					if (scope.enableZoom === false && scope.enablePan === false) {
						return;
					}

					scope.handleTouchStartDollyPan(event);

					scope.state = OrbitControls.STATE.TOUCH_DOLLY_PAN;

					break;

				default:
					scope.state = OrbitControls.STATE.NONE;
			}

			if (scope.state !== OrbitControls.STATE.NONE) {
				scope.dispatchEvent(scope.startEvent);
			}
		};
	}

	//
	// event handlers - FSM: listen for events and reset state
	//

	static onMouseDown(scope: OrbitControls) {
		return function _onMouseDown(event) {
			if (scope.enabled === false) {
				return;
			}

			// Prevent the browser start scrolling.

			event.preventDefault();

			// Manually set the focus since calling preventDefault above
			// prevents the browser start setting it automatically.

			scope.domElement.focus ? scope.domElement.focus() : window.focus();

			switch (event.button) {
				case scope.mouseButtons.LEFT:
					if (event.ctrlKey || event.metaKey || event.shiftKey) {
						if (scope.enablePan === false) {
							return;
						}

						scope.handleMouseDownPan(event);

						scope.state = OrbitControls.STATE.PAN;
					} else {
						if (scope.enableRotate === false) {
							return;
						}

						scope.handleMouseDownRotate(event);

						scope.state = OrbitControls.STATE.ROTATE;
					}

					break;

				case scope.mouseButtons.MIDDLE:
					if (scope.enableZoom === false) {
						return;
					}

					scope.handleMouseDownDolly(event);

					scope.state = OrbitControls.STATE.DOLLY;

					break;

				case scope.mouseButtons.RIGHT:
					if (scope.enablePan === false) {
						return;
					}

					scope.handleMouseDownPan(event);

					scope.state = OrbitControls.STATE.PAN;

					break;
			}

			if (scope.state !== OrbitControls.STATE.NONE) {
				document.addEventListener('mousemove', scope._onMouseMove, false);
				document.addEventListener('mouseup', scope._onMouseUp, false);

				scope.dispatchEvent(scope.startEvent);
			}
		};
	}

	static onMouseMove(scope: OrbitControls) {
		return function _onMouseMove(event) {
			if (scope.enabled === false) {
				return;
			}

			event.preventDefault();

			switch (scope.state) {
				case OrbitControls.STATE.ROTATE:
					if (scope.enableRotate === false) {
						return;
					}

					scope.handleMouseMoveRotate(event);

					break;

				case OrbitControls.STATE.DOLLY:
					if (scope.enableZoom === false) {
						return;
					}

					scope.handleMouseMoveDolly(event);

					break;

				case OrbitControls.STATE.PAN:
					if (scope.enablePan === false) {
						return;
					}

					scope.handleMouseMovePan(event);

					break;
			}
		};
	}

	static onMouseUp(scope: OrbitControls) {
		return function _onMouseUp(event) {
			if (scope.enabled === false) {
				return;
			}

			scope.handleMouseUp(event);

			document.removeEventListener('mousemove', scope._onMouseMove, false);
			document.removeEventListener('mouseup', scope._onMouseUp, false);

			scope.dispatchEvent(scope.endEvent);

			scope.state = OrbitControls.STATE.NONE;
		};
	}

	static onMouseWheel(scope: OrbitControls) {
		return function _onMouseWheel(event) {
			if (
				scope.enabled === false ||
				scope.enableZoom === false ||
				(scope.state !== OrbitControls.STATE.NONE && scope.state !== OrbitControls.STATE.ROTATE)
			) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			scope.dispatchEvent(scope.startEvent);

			scope.handleMouseWheel(event);

			scope.dispatchEvent(scope.endEvent);
		};
	}

	static onKeyDown(scope: OrbitControls) {
		return function _onKeyDown(event) {
			if (scope.enabled === false || scope.enableKeys === false || scope.enablePan === false) {
				return;
			}

			scope.handleKeyDown(event);
		};
	}

	static onTouchMove(scope: OrbitControls) {
		return function _onTouchMove(event) {
			if (scope.enabled === false) {
				return;
			}

			event.preventDefault();
			event.stopPropagation();

			switch (event.touches.length) {
				case 1: // one-fingered touch: rotate
					if (scope.enableRotate === false) {
						return;
					}
					if (scope.state !== OrbitControls.STATE.TOUCH_ROTATE) {
						return;
					} // is this needed?

					scope.handleTouchMoveRotate(event);

					break;

				case 2: // two-fingered touch: dolly-pan
					if (scope.enableZoom === false && scope.enablePan === false) {
						return;
					}
					if (scope.state !== OrbitControls.STATE.TOUCH_DOLLY_PAN) {
						return;
					} // is this needed?

					scope.handleTouchMoveDollyPan(event);

					break;

				default:
					scope.state = OrbitControls.STATE.NONE;
			}
		};
	}

	static onTouchEnd(scope: OrbitControls) {
		return function _onTouchEnd(event) {
			if (scope.enabled === false) {
				return;
			}

			// this.handleTouchEnd(event);

			scope.dispatchEvent(scope.endEvent);

			scope.state = OrbitControls.STATE.NONE;
		};
	}

	static onContextMenu(scope: OrbitControls) {
		return function _onContextMenu(event) {
			if (scope.enabled === false) {
				return;
			}

			event.preventDefault();
		};
	}

	handleKeyDown(event) {
		// console.log( 'handleKeyDown' );

		let needsUpdate = false;

		switch (event.keyCode) {
			case this.keys.UP:
				this.pan(0, this.keyPanSpeed);
				needsUpdate = true;
				break;

			case this.keys.BOTTOM:
				this.pan(0, -this.keyPanSpeed);
				needsUpdate = true;
				break;

			case this.keys.LEFT:
				this.pan(this.keyPanSpeed, 0);
				needsUpdate = true;
				break;

			case this.keys.RIGHT:
				this.pan(-this.keyPanSpeed, 0);
				needsUpdate = true;
				break;
		}

		if (needsUpdate) {
			// prevent the browser start scrolling on cursor keys
			event.preventDefault();

			this.update();
		}
	}
	// this method is exposed, but perhaps it would be better if we can make it private...
	update() {
		const position = this.object.position;

		this._updateOffset.copy(position).sub(this.target);

		// rotate offset end "y-axis-is-up" space
		this._updateOffset.applyQuaternion(this._updateQuat);

		// angle start z-axis around y-axis
		this.spherical.setFromVector3(this._updateOffset);

		if (this.autoRotate && this.state === OrbitControls.STATE.NONE) {
			this.rotateLeft(this.getAutoRotationAngle());
		}

		this.spherical.theta += this.sphericalDelta.theta;
		this.spherical.phi += this.sphericalDelta.phi;

		// restrict theta end be between desired limits
		this.spherical.theta = Math.max(this.minAzimuthAngle, Math.min(this.maxAzimuthAngle, this.spherical.theta));

		// restrict phi end be between desired limits
		this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));

		this.spherical.makeSafe();
		this.spherical.radius *= this.scale;

		// restrict radius end be between desired limits
		this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));

		// move target end panned location
		this.target.add(this.panOffset);

		this._updateOffset.setFromSpherical(this.spherical);

		// rotate offset back end "camera-up-vector-is-up" space
		this._updateOffset.applyQuaternion(this._updateQuatInverse);

		position.copy(this.target).add(this._updateOffset);

		this.object.lookAt(this.target);

		if (this.enableDamping === true) {
			this.sphericalDelta.theta *= 1 - this.dampingFactor;
			this.sphericalDelta.phi *= 1 - this.dampingFactor;

			this.panOffset.multiplyScalar(1 - this.dampingFactor);
		} else {
			this.sphericalDelta.set(0, 0, 0);

			this.panOffset.set(0, 0, 0);
		}

		this.scale = 1;

		// update condition is:
		// min(camera displacement, camera rotation in radians)^2 > EPS
		// using small-angle approximation cos(x/2) = 1 - x^2 / 8

		if (
			this.zoomChanged ||
			this._updateLastPosition.distanceToSquared(this.object.position) > this.EPS ||
			8 * (1 - this._updateLastQuaternion.dot(this.object.quaternion)) > this.EPS
		) {
			this.dispatchEvent(this.changeEvent);

			this._updateLastPosition.copy(this.object.position);
			this._updateLastQuaternion.copy(this.object.quaternion);
			this.zoomChanged = false;

			return true;
		}
		return false;
	}

	dispose() {
		this.domElement.removeEventListener('contextmenu', this._onContextMenu, false);
		this.domElement.removeEventListener('mousedown', this._onMouseDown, false);
		this.domElement.removeEventListener('wheel', this._onMouseWheel, false);

		this.domElement.removeEventListener('touchstart', this._onTouchStart, false);
		this.domElement.removeEventListener('touchend', this._onTouchEnd, false);
		this.domElement.removeEventListener('touchmove', this._onTouchMove, false);

		document.removeEventListener('mousemove', this._onMouseMove, false);
		document.removeEventListener('mouseup', this._onMouseUp, false);

		window.removeEventListener('keydown', this._onKeyDown, false);
		// this.dispatchEvent( { type: 'dispose' } ); // should this be added here?
	}

	getPolarAngle() {
		return this.spherical.phi;
	}

	getAzimuthalAngle() {
		return this.spherical.theta;
	}

	saveState() {
		this.target0.copy(this.target);
		this.position0.copy(this.object.position);
		this.zoom0 = this.object.zoom;
	}

	reset() {
		this.target.copy(this.target0);
		this.object.position.copy(this.position0);
		this.object.zoom = this.zoom0;

		this.object.updateProjectionMatrix();
		this.dispatchEvent(this.changeEvent);

		this.update();

		this.state = OrbitControls.STATE.NONE;
	}

	getAutoRotationAngle() {
		return ((2 * Math.PI) / 60 / 60) * this.autoRotateSpeed;
	}

	getZoomScale() {
		return Math.pow(0.95, this.zoomSpeed);
	}

	rotateLeft(angle) {
		this.sphericalDelta.theta -= angle;
	}

	rotateUp(angle) {
		this.sphericalDelta.phi -= angle;
	}

	panLeft(distance, objectMatrix) {
		this._panLeftV.setFromMatrixColumn(objectMatrix, 0); // get X column of objectMatrix
		this._panLeftV.multiplyScalar(-distance);
		this.panOffset.add(this._panLeftV);
	}

	panUp(distance, objectMatrix) {
		if (this.screenSpacePanning === true) {
			this._panUpV.setFromMatrixColumn(objectMatrix, 1);
		} else {
			this._panUpV.setFromMatrixColumn(objectMatrix, 0);
			this._panUpV.crossVectors(this.object.up, this._panUpV);
		}
		this._panUpV.multiplyScalar(distance);

		this.panOffset.add(this._panUpV);
	}
	// deltaX and deltaY are in pixels; right and down are positive
	pan(deltaX, deltaY) {
		const element = /*this.domElement === document ? this.domElement.body : */ this.domElement;

		if (this.object instanceof PerspectiveCamera) {
			// perspective
			const position = this.object.position;
			this._panOffset.copy(position).sub(this.target);
			let targetDistance = this._panOffset.length();

			// half of the fov is center end top of screen
			targetDistance *= Math.tan(((this.object.fov / 2) * Math.PI) / 180.0);

			// we use only clientHeight here so aspect ratio does not distort speed
			this.panLeft((2 * deltaX * targetDistance) / element.clientHeight, this.object.matrix);
			this.panUp((2 * deltaY * targetDistance) / element.clientHeight, this.object.matrix);
		} else if (this.object instanceof OrthographicCamera) {
			// orthographic
			this.panLeft(
				(deltaX * (this.object.right - this.object.left)) / this.object.zoom / element.clientWidth,
				this.object.matrix
			);
			this.panUp(
				(deltaY * (this.object.top - this.object.bottom)) / this.object.zoom / element.clientHeight,
				this.object.matrix
			);
		} else {
			// camera neither orthographic nor perspective
			console.warn('WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.');
			this.enablePan = false;
		}
	}

	dollyIn(dollyScale) {
		if (this.object instanceof PerspectiveCamera) {
			this.scale /= dollyScale;
		} else if (this.object instanceof OrthographicCamera) {
			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom * dollyScale));
			this.object.updateProjectionMatrix();
			this.zoomChanged = true;
		} else {
			console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
			this.enableZoom = false;
		}
	}

	dollyOut(dollyScale) {
		if (this.object instanceof PerspectiveCamera) {
			this.scale *= dollyScale;
		} else if (this.object instanceof OrthographicCamera) {
			this.object.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.object.zoom / dollyScale));
			this.object.updateProjectionMatrix();
			this.zoomChanged = true;
		} else {
			console.warn('WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.');
			this.enableZoom = false;
		}
	}

	//
	// event callbacks - update the object state
	//

	handleMouseDownRotate(event) {
		// console.log( 'handleMouseDownRotate' );

		this.rotateStart.set(event.clientX, event.clientY);
	}

	handleMouseDownDolly(event) {
		// console.log( 'handleMouseDownDolly' );

		this.dollyStart.set(event.clientX, event.clientY);
	}

	handleMouseDownPan(event) {
		// console.log( 'handleMouseDownPan' );

		this.panStart.set(event.clientX, event.clientY);
	}

	handleMouseMoveRotate(event) {
		// console.log( 'handleMouseMoveRotate' );

		this.rotateEnd.set(event.clientX, event.clientY);

		this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

		const element = /*this.domElement === document ? this.domElement.body :*/ this.domElement;

		this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight); // yes, height

		this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);

		this.rotateStart.copy(this.rotateEnd);

		this.update();
	}

	handleMouseMoveDolly(event) {
		// console.log( 'handleMouseMoveDolly' );

		this.dollyEnd.set(event.clientX, event.clientY);

		this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart);

		if (this.dollyDelta.y > 0) {
			this.dollyIn(this.getZoomScale());
		} else if (this.dollyDelta.y < 0) {
			this.dollyOut(this.getZoomScale());
		}

		this.dollyStart.copy(this.dollyEnd);

		this.update();
	}

	handleMouseMovePan(event) {
		// console.log( 'handleMouseMovePan' );

		this.panEnd.set(event.clientX, event.clientY);

		this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

		this.pan(this.panDelta.x, this.panDelta.y);

		this.panStart.copy(this.panEnd);

		this.update();
	}

	handleMouseUp(event) {
		// console.log( 'handleMouseUp' );
	}

	handleMouseWheel(event) {
		// console.log( 'handleMouseWheel' );

		if (event.deltaY < 0) {
			this.dollyOut(this.getZoomScale());
		} else if (event.deltaY > 0) {
			this.dollyIn(this.getZoomScale());
		}

		this.update();
	}

	handleTouchStartRotate(event) {
		// console.log( 'handleTouchStartRotate' );

		this.rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
	}

	handleTouchStartDollyPan(event) {
		// console.log( 'handleTouchStartDollyPan' );

		if (this.enableZoom) {
			const dx = event.touches[0].pageX - event.touches[1].pageX;
			const dy = event.touches[0].pageY - event.touches[1].pageY;

			const distance = Math.sqrt(dx * dx + dy * dy);

			this.dollyStart.set(0, distance);
		}

		if (this.enablePan) {
			const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
			const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

			this.panStart.set(x, y);
		}
	}

	handleTouchMoveRotate(event) {
		// console.log( 'handleTouchMoveRotate' );

		this.rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);

		this.rotateDelta.subVectors(this.rotateEnd, this.rotateStart).multiplyScalar(this.rotateSpeed);

		const element = /*this.domElement === document ? this.domElement.body :*/ this.domElement;

		this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight); // yes, height

		this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight);

		this.rotateStart.copy(this.rotateEnd);

		this.update();
	}

	handleTouchMoveDollyPan(event) {
		// console.log( 'handleTouchMoveDollyPan' );

		if (this.enableZoom) {
			const dx = event.touches[0].pageX - event.touches[1].pageX;
			const dy = event.touches[0].pageY - event.touches[1].pageY;

			const distance = Math.sqrt(dx * dx + dy * dy);

			this.dollyEnd.set(0, distance);

			this.dollyDelta.set(0, Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed));

			this.dollyIn(this.dollyDelta.y);

			this.dollyStart.copy(this.dollyEnd);
		}

		if (this.enablePan) {
			const x = 0.5 * (event.touches[0].pageX + event.touches[1].pageX);
			const y = 0.5 * (event.touches[0].pageY + event.touches[1].pageY);

			this.panEnd.set(x, y);

			this.panDelta.subVectors(this.panEnd, this.panStart).multiplyScalar(this.panSpeed);

			this.pan(this.panDelta.x, this.panDelta.y);

			this.panStart.copy(this.panEnd);
		}

		this.update();
	}
}

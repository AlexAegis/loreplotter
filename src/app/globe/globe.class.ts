import * as THREE from 'three';
import { Geometry, Mesh } from 'three';

export class Globe {
	static Shaders = {
		earth: {
			uniforms: {
				texture: { type: 't', value: null }
			},
			vertexShader: [
				'varying vec3 vNormal;',
				'varying vec2 vUv;',
				'void main() {',
				'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
				'vNormal = normalize( normalMatrix * normal );',
				'vUv = uv;',
				'}'
			].join('\n'),
			fragmentShader: [
				'uniform sampler2D texture;',
				'varying vec3 vNormal;',
				'varying vec2 vUv;',
				'void main() {',
				'vec3 diffuse = texture2D( texture, vUv ).xyz;',
				'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
				'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
				'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
				'}'
			].join('\n')
		},
		atmosphere: {
			uniforms: {},
			vertexShader: [
				'varying vec3 vNormal;',
				'void main() {',
				'vNormal = normalize( normalMatrix * normal );',
				'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
				'}'
			].join('\n'),
			fragmentShader: [
				'varying vec3 vNormal;',
				'void main() {',
				'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
				'gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 ) * intensity;',
				'}'
			].join('\n')
		}
	};

	container;
	opts = [];
	_time;

	imgDir = '/assets/';

	camera;
	scene;
	renderer;
	w;
	h;
	mesh;
	atmosphere;
	point;

	overRenderer;

	curZoomSpeed = 0;
	zoomSpeed = 50;

	mouse = { x: 0, y: 0 };
	mouseOnDown = { x: 0, y: 0 };
	rotation = { x: 0, y: 0 };
	target = { x: (Math.PI * 3) / 2, y: Math.PI / 6.0 };
	targetOnDown = { x: 0, y: 0 };

	distance = 100000;
	distanceTarget = 100000;
	padding = 40;
	PI_HALF = Math.PI / 2;

	constructor(container, opts?: any) {
		this.container = container;
		this.opts = opts;
		this.init();
	}

	get time() {
		return this._time || 0;
	}

	set time(t) {
		let validMorphs = [];
		let morphDict = this.points.morphTargetDictionary;
		for (let k in morphDict) {
			if (k.indexOf('morphPadding') < 0) {
				validMorphs.push(morphDict[k]);
			}
		}
		validMorphs.sort();
		let l = validMorphs.length - 1;
		let scaledt = t * l + 1;
		let index = Math.floor(scaledt);
		for (let i = 0; i < validMorphs.length; i++) {
			this.points.morphTargetInfluences[validMorphs[i]] = 0;
		}
		let lastIndex = index - 1;
		let leftover = scaledt - index;
		if (lastIndex >= 0) {
			this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
		}
		this.points.morphTargetInfluences[index] = leftover;
		this._time = t;
	}

	colorFn(x) {
		let c = new THREE.Color();
		c.setHSL(0.6 - x * 0.5, 1.0, 0.5);
		return c;
	}

	init() {
		this.container.style.color = '#fff';
		this.container.style.font = '13px/20px Arial, sans-serif';

		let shader, uniforms, material;
		this.w = this.container.offsetWidth || window.innerWidth;
		this.h = this.container.offsetHeight || window.innerHeight;

		this.camera = new THREE.PerspectiveCamera(30, this.w / this.h, 1, 10000);
		this.camera.position.z = this.distance;

		this.scene = new THREE.Scene();

		let geometry: Geometry = new THREE.SphereGeometry(200, 40, 30);

		shader = Globe.Shaders['earth'];
		uniforms = THREE.UniformsUtils.clone(shader.uniforms);

		uniforms['texture'].value = THREE.ImageUtils.loadTexture(this.imgDir + 'world.jpg');

		material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.rotation.y = Math.PI;
		this.scene.add(this.mesh);

		shader = Globe.Shaders['atmosphere'];
		uniforms = THREE.UniformsUtils.clone(shader.uniforms);

		material = new THREE.ShaderMaterial({
			uniforms: uniforms,
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader,
			side: THREE.BackSide,
			blending: THREE.AdditiveBlending,
			transparent: true
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.mesh.scale.set(1.1, 1.1, 1.1);
		this.scene.add(this.mesh);

		geometry = new THREE.BoxGeometry(0.75, 0.75, 1);
		geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 0, -0.5));

		this.point = new THREE.Mesh(geometry);

		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(this.w, this.h);

		this.renderer.domElement.style.position = 'absolute';

		this.container.appendChild(this.renderer.domElement);

		this.container.addEventListener('mousedown', this.onMouseDown, false);

		this.container.addEventListener('mousewheel', this.onMouseWheel, false);

		document.addEventListener('keydown', this.onDocumentKeyDown, false);

		window.addEventListener('resize', this.onWindowResize, false);

		this.container.addEventListener(
			'mouseover',
			function() {
				this.overRenderer = true;
			},
			false
		);

		this.container.addEventListener(
			'mouseout',
			function() {
				this.overRenderer = false;
			},
			false
		);
	}
	is_animated;
	_baseGeometry;
	_morphTargetId;
	addData(data, opts) {
		let lat, lng, size, color, i, step, colorFnWrapper;

		opts.animated = opts.animated || false;
		this.is_animated = opts.animated;
		opts.format = opts.format || 'magnitude'; // other option is 'legend'
		if (opts.format === 'magnitude') {
			step = 3;
			colorFnWrapper = function(data, i) {
				return this.colorFn(data[i + 2]);
			};
		} else if (opts.format === 'legend') {
			step = 4;
			colorFnWrapper = function(data, i) {
				return this.colorFn(data[i + 3]);
			};
		} else {
			throw 'error: format not supported: ' + opts.format;
		}

		if (opts.animated) {
			if (this._baseGeometry === undefined) {
				this._baseGeometry = new THREE.Geometry();
				for (i = 0; i < data.length; i += step) {
					lat = data[i];
					lng = data[i + 1];
					//        size = data[i + 2];
					color = colorFnWrapper(data, i);
					size = 0;
					this.addPoint(lat, lng, size, color, this._baseGeometry);
				}
			}
			if (this._morphTargetId === undefined) {
				this._morphTargetId = 0;
			} else {
				this._morphTargetId += 1;
			}
			opts.name = opts.name || 'morphTarget' + this._morphTargetId;
		}
		let subgeo = new THREE.Geometry();
		for (i = 0; i < data.length; i += step) {
			lat = data[i];
			lng = data[i + 1];
			color = colorFnWrapper(data, i);
			size = data[i + 2];
			size = size * 200;
			this.addPoint(lat, lng, size, color, subgeo);
		}
		if (opts.animated) {
			this._baseGeometry.morphTargets.push({ name: opts.name, vertices: subgeo.vertices });
		} else {
			this._baseGeometry = subgeo;
		}
	}
	points: Mesh;
	createPoints() {
		if (this._baseGeometry !== undefined) {
			if (this.is_animated === false) {
				this.points = new THREE.Mesh(
					this._baseGeometry,
					new THREE.MeshBasicMaterial({
						color: 0xffffff,
						vertexColors: THREE.FaceColors,
						morphTargets: false
					})
				);
			} else {
				if (this._baseGeometry.morphTargets.length < 8) {
					console.log('t l', this._baseGeometry.morphTargets.length);
					let padding = 8 - this._baseGeometry.morphTargets.length;
					console.log('padding', padding);
					for (let i = 0; i <= padding; i++) {
						console.log('padding', i);
						this._baseGeometry.morphTargets.push({
							name: 'morphPadding' + i,
							vertices: this._baseGeometry.vertices
						});
					}
				}
				this.points = new THREE.Mesh(
					this._baseGeometry,
					new THREE.MeshBasicMaterial({
						color: 0xffffff,
						vertexColors: THREE.FaceColors,
						morphTargets: true
					})
				);
			}
			this.scene.add(this.points);
		}
	}

	addPoint(lat, lng, size, color, subgeo) {
		let phi = ((90 - lat) * Math.PI) / 180;
		let theta = ((180 - lng) * Math.PI) / 180;

		this.point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
		this.point.position.y = 200 * Math.cos(phi);
		this.point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

		this.point.lookAt(this.mesh.position);

		this.point.scale.z = Math.max(size, 0.1); // avoid non-invertible matrix
		this.point.updateMatrix();

		for (let i = 0; i < this.point.geometry.faces.length; i++) {
			this.point.geometry.faces[i].color = color;
		}
		if (this.point.matrixAutoUpdate) {
			this.point.updateMatrix();
		}
		subgeo.merge(this.point.geometry, this.point.matrix);
	}

	onMouseDown(event) {
		event.preventDefault();

		this.container.addEventListener('mousemove', this.onMouseMove, false);
		this.container.addEventListener('mouseup', this.onMouseUp, false);
		this.container.addEventListener('mouseout', this.onMouseOut, false);

		this.mouseOnDown.x = -event.clientX;
		this.mouseOnDown.y = event.clientY;

		this.targetOnDown.x = this.target.x;
		this.targetOnDown.y = this.target.y;

		this.container.style.cursor = 'move';
	}

	onMouseMove(event) {
		this.mouse.x = -event.clientX;
		this.mouse.y = event.clientY;

		let zoomDamp = this.distance / 1000;

		this.target.x = this.targetOnDown.x + (this.mouse.x - this.mouseOnDown.x) * 0.005 * zoomDamp;
		this.target.y = this.targetOnDown.y + (this.mouse.y - this.mouseOnDown.y) * 0.005 * zoomDamp;

		this.target.y = this.target.y > this.PI_HALF ? this.PI_HALF : this.target.y;
		this.target.y = this.target.y < -this.PI_HALF ? -this.PI_HALF : this.target.y;
	}

	onMouseUp(event) {
		this.container.removeEventListener('mousemove', this.onMouseMove, false);
		this.container.removeEventListener('mouseup', this.onMouseUp, false);
		this.container.removeEventListener('mouseout', this.onMouseOut, false);
		this.container.style.cursor = 'auto';
	}

	onMouseOut(event) {
		this.container.removeEventListener('mousemove', this.onMouseMove, false);
		this.container.removeEventListener('mouseup', this.onMouseUp, false);
		this.container.removeEventListener('mouseout', this.onMouseOut, false);
	}

	onMouseWheel(event) {
		event.preventDefault();
		if (this.overRenderer) {
			this.zoom(event.wheelDeltaY * 0.3);
		}
		return false;
	}

	onDocumentKeyDown(event) {
		switch (event.keyCode) {
			case 38:
				this.zoom(100);
				event.preventDefault();
				break;
			case 40:
				this.zoom(-100);
				event.preventDefault();
				break;
		}
	}

	onWindowResize(event) {
		this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
	}

	zoom(delta) {
		this.distanceTarget -= delta;
		this.distanceTarget = this.distanceTarget > 1000 ? 1000 : this.distanceTarget;
		this.distanceTarget = this.distanceTarget < 350 ? 350 : this.distanceTarget;
	}

	animate() {
		requestAnimationFrame(this.animate);
		this.render();
	}

	render() {
		this.zoom(this.curZoomSpeed);

		this.rotation.x += (this.target.x - this.rotation.x) * 0.1;
		this.rotation.y += (this.target.y - this.rotation.y) * 0.1;
		this.distance += (this.distanceTarget - this.distance) * 0.3;

		this.camera.position.x = this.distance * Math.sin(this.rotation.x) * Math.cos(this.rotation.y);
		this.camera.position.y = this.distance * Math.sin(this.rotation.y);
		this.camera.position.z = this.distance * Math.cos(this.rotation.x) * Math.cos(this.rotation.y);

		this.camera.lookAt(this.mesh.position);

		this.renderer.render(this.scene, this.camera);
	}
}

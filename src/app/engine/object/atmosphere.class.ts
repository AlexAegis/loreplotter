import { Basic } from './basic.class';
import { Sun } from './sun.class';
import { Planet } from './../../model/planet.class';
import * as THREE from 'three';
import { Object3D, ShaderMaterialParameters, SphereBufferGeometry, ShaderMaterial } from 'three';
import { atmosphereShader } from '../shader/atmosphere.shader';
import { Globe } from './globe.class';
import * as dat from 'dat.gui';

export class Atmosphere extends Basic {
	public planet_scene: THREE.Scene;
	public planet_camera: THREE.PerspectiveCamera;
	public planet_texture: THREE.WebGLRenderTarget;
	public base_directions: Array<THREE.Vector3>;
	public directions: Array<THREE.Vector3>;
	public rayleigh_length: number;
	public rayleigh_constant: number;
	public mie_length: number;
	public mie_constant: number;
	public radius: number;
	public uniforms: any;
	public attributes: any;
	public mesh: THREE.Mesh;

	public scene: THREE.Scene;
	public camera: THREE.OrthographicCamera;

	public time: number;

	constructor(private planet: Globe) {
		super();

		this.geometry = new SphereBufferGeometry(planet.radius * 1.1, 80, 80);

		const gui = new dat.GUI();

		this.material = new THREE.MeshPhysicalMaterial({
			color: '#6266ff',
			side: THREE.BackSide,
			transparent: true,
			opacity: 0.02,
			emissive: '#6266ff',
			emissiveIntensity: 1
		});

		this.receiveShadow = false;
		this.castShadow = false;
	}
}

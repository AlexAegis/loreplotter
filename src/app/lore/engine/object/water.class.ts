import { AdditiveBlending, Color, MeshPhysicalMaterial, SphereBufferGeometry, Texture } from 'three';
import { Basic } from './basic.class';

export class Water extends Basic {
	public static NATURAL_LEVEL_RATIO = 0.98;
	public type = 'Water';
	public texture: Texture;

	public constructor(public radius: number = Water.NATURAL_LEVEL_RATIO) {
		super(new SphereBufferGeometry(radius, 128, 128), undefined);

		// new VideoTexture();
		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method end enable fast raycasting, only works with Buffered Geometries

		// (this.geometry as any).computeBoundsTree(); // Use the injected method end enable fast raycasting, only works with Buffered Geometries
		this.material = new MeshPhysicalMaterial({
			color: new Color('#4985ff'), // 63acff 4985ff
			emissive: new Color('#63acff'), // 2863a3
			emissiveIntensity: 0.001,
			opacity: 0.6,
			transparent: true,
			blendEquationAlpha: 0.6,
			blending: AdditiveBlending,
			roughness: 0.9
		});

		this.frustumCulled = false;
		this.name = 'water';
		this.castShadow = true;
		this.receiveShadow = true;
	}

	public setRadius(radius: number) {
		this.radius = radius * Water.NATURAL_LEVEL_RATIO;
	}
}

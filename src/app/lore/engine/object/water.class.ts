import { Color, TextureLoader, Texture, RepeatWrapping, SphereBufferGeometry, MeshPhysicalMaterial } from 'three';
import { Basic } from './basic.class';

export class Water extends Basic {
	public type = 'Water';
	public texture: Texture;
	constructor(private radius: number = 0.98) {
		super(new SphereBufferGeometry(radius, 128, 128), undefined);
		this.texture = new TextureLoader().load(`assets/textures/water/ripple.gif`, tex => {
			tex.wrapS = tex.wrapT = RepeatWrapping;
			tex.offset.set(0, 0);
			tex.repeat.set(100, 100);
			tex.anisotropy = 4;
		}); // TODO: Animate the gif

		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method to enable fast raycasting, only works with Buffered Geometries

		// (this.geometry as any).computeBoundsTree(); // Use the injected method to enable fast raycasting, only works with Buffered Geometries
		this.material = new MeshPhysicalMaterial({
			color: new Color('#63acff'), // 63acff
			emissive: new Color('#29b6f6'), // 2863a3
			emissiveIntensity: 0.004,
			opacity: 0.7,
			transparent: true,
			//  alphaMap: this.texture,
			// blendEquationAlpha: 1.1,
			// blending: MultiplyBlending,
			bumpMap: this.texture,
			bumpScale: 0.0001,
			roughness: 0.6,
			metalness: 0.3,
			reflectivity: 0.3,
			clearCoat: 0.3,
			clearCoatRoughness: 0.8
		});

		this.frustumCulled = false;
		this.name = 'water';
		this.castShadow = true;
		this.receiveShadow = true;
	}
}

import { Basic } from '@lore/engine/object/basic.class';
import { Globe } from '@lore/engine/object/globe.class';
import { AdditiveBlending, MeshBasicMaterial, SphereBufferGeometry } from 'three';

export class IndicatorSphere extends Basic {

	/**
	 * TODO nudge the position in the direction of the actor by the displacement value
	 *
	 * @param name of the object
	 * @param globe Globe
	 */
	public constructor(public name: string, private globe: Globe) {
		super(undefined, undefined);
		console.log('indicator crafted');
		super.rotateX(Math.PI / 2);

		this.geometry = new SphereBufferGeometry(1, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.5);

		this.material = new MeshBasicMaterial({
			color: '#ff7c38',
			opacity: 0.1,
			transparent: true,
			blending: AdditiveBlending,
			reflectivity: 0,
			depthTest: false
		});

		this.doHide();
		super.castShadow = false;
	}

	public doShow(): void {
		super.visible = true;
	}

	public doHide(): void {
		super.visible = false;
	}

	/**
	 * 1 PI theta length is the full sphere.
	 * @param km target
	 */
	public setTargetRadius(km: number): void {
		const c = km / this.globe.radius;
		this.geometry = new SphereBufferGeometry(1, 64, 64, 0, Math.PI * 2, 0, c);
	}
}



/***

 old constructor for spotlight experiment
 super(0xe6561a);
 console.log('indicator crafted');
 // this.type = 'Indicator';
 this.position.set(0, 0, 2);
 this.intensity = 2;
 this.penumbra = 0;
 this.distance = 1000000000;
 this.decay = 0;
 this.castShadow = false;
 // (this.geometry as any).computeBoundsTree(); // Use

 }
 */

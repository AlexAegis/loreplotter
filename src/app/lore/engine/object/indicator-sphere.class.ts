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
		this.rotateX(Math.PI / 2);

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
		this.castShadow = false;
	}

	public doShow(): void {
		this.visible = true;
	}

	public doHide(): void {
		this.visible = false;
	}

	/**
	 * 1 PI theta length is the full sphere.
	 * @param km target
	 */
	public setTargetRadius(km: number): void {
		this.setTargetRadian(km / this.globe.radius);
	}

	public setTargetRadian(radian: number): void {
		this.geometry = new SphereBufferGeometry(1, 64, 64, 0, Math.PI * 2, 0, Math.min(radian, Math.PI));
	}
}

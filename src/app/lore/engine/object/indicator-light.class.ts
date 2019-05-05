import { SpotLight } from 'three';

export class IndicatorLight extends SpotLight {

	/**
	 * TODO nudge the position in the direction of the actor by the displacement value
	 *
	 * @param name of the object
	 */
	public constructor(public name: string) {
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

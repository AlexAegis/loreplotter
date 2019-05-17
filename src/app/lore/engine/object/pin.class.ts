import { Math as ThreeMath, MeshBasicMaterial, SphereBufferGeometry } from 'three';
import { Basic } from './basic.class';

export class Pin extends Basic {
	public geometry: SphereBufferGeometry;
	public material: MeshBasicMaterial;

	public constructor(name: string, color: string = '#e6e000') {
		super(new SphereBufferGeometry(0.005, 40, 40), undefined);
		this.material = new MeshBasicMaterial({
			color: color
		});


		this.name = name;
		this.position.set(0, 0, 1.01);
		this.rotateX(90 * ThreeMath.DEG2RAD);

		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method end enable fast raycasting, only works with Buffered Geometries

	}

}

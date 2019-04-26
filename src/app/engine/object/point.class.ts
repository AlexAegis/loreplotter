import * as THREE from 'three';

import { Basic } from './basic.class';
import { Vector3 } from 'three';
import { Globe } from './globe.class';
import { RxDocument } from 'rxdb';
import { Actor } from 'src/app/model/actor.class';

export class Point extends Basic {
	public lastWorldPosition = new Vector3();

	constructor(public actor: RxDocument<Actor>) {
		super(new THREE.SphereBufferGeometry(0.05, 40, 40), undefined);
		this.name = actor.id;
		this.type = 'Point';
		this.position.set(0, 0, 1);
		this.rotateX(90 * THREE.Math.DEG2RAD);
		this.material = new THREE.MeshBasicMaterial({
			wireframe: false,
			opacity: 0.8,
			transparent: false,
			color: 0xaa4444
		});
		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method to enable fast raycasting, only works with Buffered Geometries

		this.addEventListener('pan', event => {
			this.parent.lookAt(event.point);
			this.updateHeightAndWorldPos();
			this.parent.userData.override = true;
		});
	}

	public updateHeightAndWorldPos(): void {
		this.parent.updateWorldMatrix(false, true);
		this.updateHeight();
	}

	public updateHeight(): void {
		const engineService = this.stage.engineService;
		const globe = this.parent.parent as Globe;
		const worldPos = this.getWorldPosition(this.lastWorldPosition);
		// console.log(worldPos);
		worldPos.multiplyScalar(1.1); // Look from further away;
		const toCenter = worldPos
			.clone()
			.multiplyScalar(-1)
			.normalize();
		engineService.raycaster.set(worldPos, toCenter);

		// engineService.raycaster.setFromCamera(Axis.center, engineService.stage.camera);
		const intersection = engineService.raycaster.intersectObject(globe)[0];
		if (intersection) {
			//  but there's always be an intersection as the globe is spherical
			const displacementHere = globe.displacementTexture.heightAt(intersection.uv);
			this.position.set(0, 0, globe.radius + displacementHere * globe.displacementScale + globe.displacementBias);
		}
	}
}

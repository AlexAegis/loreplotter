import * as THREE from 'three';

import { Interactive } from '../interfaces/interactive.interface';
import { Basic } from './basic.class';
import * as dat from 'dat.gui';
import { Vector3 } from 'three';
import { Globe } from './globe.class';

export class Point extends Basic implements Interactive {
	private defaultMaterial = new THREE.MeshBasicMaterial({
		wireframe: false,
		opacity: 0.8,
		transparent: false,
		color: 0xaa4444
	});

	private selectedMaterial = new THREE.MeshBasicMaterial({
		wireframe: true,
		opacity: 0.9,
		transparent: false,
		color: 0xaa4444
	});

	private highlightMaterial = new THREE.MeshBasicMaterial({
		wireframe: false,
		opacity: 0.6,
		transparent: false,
		color: 0xaa8888
	});

	public lastWorldPosition = new Vector3();

	constructor(public name: string) {
		super(new THREE.SphereBufferGeometry(0.05, 40, 40), undefined);
		this.type = 'Point';
		this.position.set(0, 0, 1);
		this.rotateX(90 * THREE.Math.DEG2RAD);
		this.material = this.defaultMaterial;
		(this.geometry as any).computeFaceNormals();
		this.geometry.computeVertexNormals();
		this.geometry.computeBoundingSphere();
		(this.geometry as any).computeBoundsTree(); // Use the injected method to enable fast raycasting, only works with Buffered Geometries
		this.addEventListener('click', attachment => {
			// this.stage.engineService.selected.next(this);
		});

		this.addEventListener('context', attachment => {
			this.stage.engineService.selected.next(this);
		});

		this.addEventListener('hover', attachment => {
			this.stage.engineService.hovered.next(this);
		});

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

	select() {
		this.material = this.selectedMaterial;
	}

	deselect() {
		this.material = this.defaultMaterial;
	}

	hover() {
		this.material = this.highlightMaterial;
	}

	unhover() {
		if (this.stage.engineService.selected.value === this) {
			this.select();
		} else {
			this.deselect();
		}
	}
}

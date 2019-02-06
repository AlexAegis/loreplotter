import { PopupComponent } from './../component/popup/popup.component';
import { EngineService } from './engine.service';
import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Vector3, Euler } from 'three';
@Component({
	selector: 'app-engine',
	templateUrl: './engine.component.html',
	styleUrls: ['./engine.component.scss']
})
export class EngineComponent implements AfterViewInit, OnDestroy {
	@ViewChild('canvas')
	canvas: ElementRef;

	@ViewChild('indicator')
	indicator: PopupComponent;

	globerot: Vector3 = new Vector3(0, 1, 1);
	topPos: string;
	leftPos: string;

	constructor(public engine: EngineService) {}

	/**
	 * Normalizes a set of coordinates originated from the Window into [0, 1]
	 *
	 * @param x of the window
	 * @param y .of the window
	 * @returns normalized coordinates as a vector
	 */
	static normalize(x: number, y: number): Vector3 {
		return new Vector3((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
	}

	/**
	 * Denormalizes a coordinate
	 *
	 * @param coordinate to be denormalized
	 * @returns the coordinates as in windowcoordinates
	 */
	static denormalize(coordinate: Vector3): Vector3 {
		return new Vector3(
			((coordinate.x + 1) / 2) * window.innerWidth,
			((coordinate.y - 1) / -2) * window.innerHeight
		);
	}

	ngAfterViewInit(): void {
		this.engine.createScene(this.canvas.nativeElement);
		this.engine.animate();
		this.engine.globe.rotationChange.subscribe((next: Vector3) => {
			this.globerot = next;
			this.leftPos = `${next.x}px`;
			this.topPos = `${next.y}px`;
		});
	}

	public pan($event: any): void {
		this.engine.globe.rotate($event.velocityX * 4, $event.velocityY * 4, $event.isFinal);
	}

	public turnRight() {
		this.engine.globe.turnAngleOnX(90);
	}

	public wheel($event: WheelEvent) {
		this.engine.zoom($event.deltaY);
	}

	@HostListener('document:keypress', ['$event'])
	handleKeyboardEvent(event: KeyboardEvent) {
		// space
		if (event.charCode === 32) {
			// refresh indicator, for now we're doing this
			this.indicator.open = !this.indicator.open;
		}
	}

	public click($event: any) {
		console.log($event);
		this.engine.click(EngineComponent.normalize($event.center.x, $event.center.y), $event.srcEvent.shiftKey);
	}

	ngOnDestroy(): void {}
}

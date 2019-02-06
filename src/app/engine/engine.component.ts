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

	constructor(public engine: EngineService) {}

	ngAfterViewInit(): void {
		this.engine.createScene(this.canvas.nativeElement);
		this.engine.animate();
		this.engine.globe.rotationChange.subscribe((next: Vector3) => {
			this.globerot = next;
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
		this.engine.click(
			($event.center.x / window.innerWidth) * 2 - 1,
			-($event.center.y / window.innerHeight) * 2 + 1,
			$event.srcEvent.shiftKey
		);
	}

	ngOnDestroy(): void {}
}

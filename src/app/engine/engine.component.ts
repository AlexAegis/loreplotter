import { PopupComponent } from './../component/popup/popup.component';
import { EngineService } from './engine.service';
import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Vector3, Euler } from 'three';
import { normalize } from './helper/normalize.function';
import { Point } from './object/point.class';
import { denormalize } from './helper/denormalize.function';
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

	ngAfterViewInit(): void {
		this.engine.createScene(this.canvas.nativeElement);
		this.engine.animate();
		this.engine.indicator = this.indicator;
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
		//
		this.engine.click(normalize($event.center.x, $event.center.y), $event.srcEvent.shiftKey);
	}

	public hover($event: any) {
		this.engine.hover(normalize($event.clientX, $event.clientY));
	}
	ngOnDestroy(): void {}
}

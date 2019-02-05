import { EngineService } from './engine.service';
import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';

@Component({
	selector: 'app-engine',
	templateUrl: './engine.component.html',
	styleUrls: ['./engine.component.scss']
})
export class EngineComponent implements AfterViewInit, OnDestroy {
	@ViewChild('canvas')
	canvas: ElementRef;

	constructor(private engine: EngineService) {}

	ngAfterViewInit(): void {
		this.engine.createScene(this.canvas.nativeElement);
		this.engine.animate();
	}

	public pan($event: any): void {
		this.engine.rotate($event.velocityX * 4, $event.velocityY * 4, $event.isFinal);
	}

	public turnRight() {
		this.engine.turnAngleOnX(90);
	}

	public wheel($event: WheelEvent) {
		this.engine.zoom($event.deltaY);
	}

	ngOnDestroy(): void {}
}

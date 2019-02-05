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
		this.engine.globe.rotate($event.velocityX * 4, $event.velocityY * 4, $event.isFinal);
	}

	public turnRight() {
		this.engine.globe.turnAngleOnX(90);
	}

	public wheel($event: WheelEvent) {
		this.engine.zoom($event.deltaY);
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

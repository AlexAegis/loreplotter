import { SkyhookDndService } from '@angular-skyhook/core';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { normalizeFromWindow } from '@app/function';
import { DatabaseService, LoreService } from '@app/service';
import { PopupComponent } from '@lore/component';
import { EngineService } from '@lore/engine/engine.service';
import { Vector2 } from 'three';

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

	drop = this.dnd.dropTarget('Actor', {
		drop: monitor => this.loreService.spawnActorOnClientOffset.next(monitor.getClientOffset())
	});

	constructor(
		public engineService: EngineService,
		public db: DatabaseService,
		public loreService: LoreService,
		private dnd: SkyhookDndService
	) {}

	ngAfterViewInit(): void {
		this.engineService.createScene(this.canvas.nativeElement);
		this.engineService.animate();
		console.log(this);
	}

	public pan($event: any): void {
		this.engineService.pan(
			normalizeFromWindow($event.center.x, $event.center.y),
			new Vector2($event.velocityX * 2, $event.velocityY * 2),
			$event.button,
			$event.type === 'panstart',
			$event.type === 'panend'
		);
	}

	public contextmenu($event: any): boolean {
		console.log($event);
		let pos;
		if ($event.type === 'press') {
			// Hammer press event
			pos = $event.center;
		} else if ($event.type === 'contextmenu') {
			// Right click
			pos = { x: $event.clientX, y: $event.clientY };
		}
		this.engineService.context(normalizeFromWindow(pos.x, pos.y));
		return false;
	}

	public tap($event: any) {
		$event.stopPropagation();
		switch ($event.button) {
			case undefined:
			case 0:
				this.engineService.click(
					normalizeFromWindow($event.center.x, $event.center.y),
					$event.srcEvent.shiftKey
				);
				break;
			case 2:
				this.engineService.context(normalizeFromWindow($event.center.x, $event.center.y));
				break;
		}
		this.engineService.refreshPopupPosition();
	}

	public hover($event: any) {
		this.engineService.hover(normalizeFromWindow($event.clientX, $event.clientY));
	}

	ngOnDestroy(): void {}
}

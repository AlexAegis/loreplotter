import { SkyhookDndService } from '@angular-skyhook/core';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Vector2 } from 'three';

import { DatabaseService } from '../database/database.service';
import { LoreService } from '../service/lore.service';
import { PopupComponent } from './../component/popup/popup.component';
import { EngineService } from './engine.service';
import { normalize } from './helper/normalize.function';

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
		drop: monitor => {
			console.log(monitor.getClientOffset());
			this.loreService.spawnOnClientOffset$.next(monitor.getClientOffset());
		}
	});

	constructor(
		public engine: EngineService,
		public db: DatabaseService,
		public loreService: LoreService,
		private dnd: SkyhookDndService
	) {}

	ngAfterViewInit(): void {
		this.engine.createScene(this.canvas.nativeElement);
		this.engine.animate();
	}

	public pan($event: any): void {
		this.engine.pan(
			normalize($event.center.x, $event.center.y),
			new Vector2($event.velocityX * 2, $event.velocityY * 2),
			$event.type === 'panstart',
			$event.type === 'panend'
		);
	}

	public contextmenu($event: any): boolean {
		let pos;
		if ($event.type === 'press') {
			// Hammer press event
			pos = $event.center;
		} else if ($event.type === 'contextmenu') {
			// Right click
			pos = { x: $event.clientX, y: $event.clientY };
		}
		this.engine.context(normalize(pos.x, pos.y));
		return false;
	}

	public tap($event: any) {
		this.engine.click(normalize($event.center.x, $event.center.y), $event.srcEvent.shiftKey);
		this.engine.globe.changed();
	}

	public hover($event: any) {
		this.engine.hover(normalize($event.clientX, $event.clientY));
	}

	ngOnDestroy(): void {}
}

import { DatabaseService } from '../database/database.service';
import { PopupComponent } from './../component/popup/popup.component';
import { EngineService } from './engine.service';
import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Vector3, Euler, Vector2 } from 'three';
import { normalize } from './helper/normalize.function';
import { Point } from './object/point.class';
import { denormalize } from './helper/denormalize.function';
import { LoreService } from '../service/lore.service';
import { SkyhookDndService } from '@angular-skyhook/core';
import { Actor } from '../model/actor.class';
import { combineLatest, from, of } from 'rxjs';
import * as moment from 'moment';

import { UnixWrapper } from '../model/unix-wrapper.class';
import { ActorDelta } from '../model/actor-delta.class';
import { take } from 'rxjs/operators';
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
		console.log($event);
		this.engine.pan(
			normalize($event.center.x, $event.center.y),
			new Vector2($event.velocityX * 2, $event.velocityY * 2),
			$event.type === 'panstart',
			$event.type === 'panend'
		);
	}

	public turnRight() {
		this.engine.globe.turnAngleOnX(90);
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

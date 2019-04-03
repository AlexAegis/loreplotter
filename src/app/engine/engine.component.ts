import { DatabaseService } from '../database/database.service';
import { PopupComponent } from './../component/popup/popup.component';
import { EngineService } from './engine.service';
import { Component, AfterViewInit, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { Vector3, Euler } from 'three';
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
		drop: monitor => this.loreService.monitor$.next(monitor.getClientOffset())
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
		this.engine.globe.rotate($event.velocityX * 2, $event.velocityY * 2, $event.isFinal);
	}

	public turnRight() {
		this.engine.globe.turnAngleOnX(90);
	}

	public wheel($event: WheelEvent) {
		this.engine.stage.zoom($event.deltaY);
	}

	@HostListener('document:keypress', ['$event'])
	handleKeyboardEvent(event: KeyboardEvent) {
		console.log('key');
		// space
		if (event.key === 'space') {
			// refresh indicator, for now we're doing this
			this.indicator.open = !this.indicator.open;
		}
	}

	public click($event: any) {
		this.engine.click(normalize($event.center.x, $event.center.y), $event.srcEvent.shiftKey);
	}

	public hover($event: any) {
		this.engine.hover(normalize($event.clientX, $event.clientY));
	}

	ngOnDestroy(): void {}
}

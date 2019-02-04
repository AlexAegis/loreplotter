import { EngineService } from './engine.service';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, ReplaySubject, Subject, of, interval, timer, Subscription } from 'rxjs';
import {
	takeUntil,
	take,
	throttle,
	combineAll,
	throttleTime,
	mergeAll,
	mergeMap,
	debounce,
	delay,
	debounceTime,
	pairwise,
	concat,
	repeat,
	tap
} from 'rxjs/operators';

import { Tween, Easing, update } from '@tweenjs/tween.js';
@Component({
	selector: 'app-engine',
	templateUrl: './engine.component.html',
	styleUrls: []
})
export class EngineComponent implements AfterViewInit, OnDestroy {
	@ViewChild('canvas')
	canvas: ElementRef;

	mouse: Subject<PointerEvent> = new ReplaySubject(1);
	mouse$: Observable<PointerEvent>;
	mouse$sub: Subscription;
	t: Tween;
	constructor(private engine: EngineService) {
		this.mouse$ = this.mouse.asObservable();
		/*this.mouse$sub = this.mouse$
			.pipe(
				throttleTime(150),
				pairwise()
			)
			.subscribe((e: Array<any>) => {
				new Tween(e[0]).to(e[1], 150)
				this.engine.rotate(e[0].velocityX, e[0].velocityY);
			});*/
	}

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

	ngOnDestroy(): void {
		//this.mouse$sub.unsubscribe();
	}
}

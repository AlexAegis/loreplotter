import { CursorComponent } from './../cursor/cursor.component';
import {
	Component,
	OnInit,
	HostListener,
	AfterViewInit,
	ElementRef,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	ViewChild,
	HostBinding
} from '@angular/core';
import * as moment from 'moment';
import { Moment } from 'moment';
import ResizeObserver from 'resize-observer-polyfill';
import * as THREE from 'three';
import { DatabaseService } from 'src/app/database/database.service';
import { switchMap, tap, take } from 'rxjs/operators';
import { Actor } from 'src/app/model/actor.class';
import { LoreService } from 'src/app/service/lore.service';
import * as TWEEN from '@tweenjs/tween.js';
import { DeltaProperty } from 'src/app/model/delta-property.class';
import { normalize } from 'src/app/engine/helper/normalize.function';
import { rescale } from 'src/app/misc/rescale.function';

/**
 * Timeline
 *
 * Has a framestart and a frame end which together describe a timeframe of which time is displayed in this Component
 *
 * It also has a dynamic scale factor which changes depending on the size of the frame.
 * The frame's scale is always one above the largest time unit the frame encapsulates.
 * For example, if the frame is just larger than a month, then the scale would be one below that. A week.
 * The start and end positions, along with the scale then determines how the scale will be divided. And to how many parts.
 *
 */
@Component({
	selector: 'app-timeline',
	templateUrl: './timeline.component.html',
	styleUrls: ['./timeline.component.scss']
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit, AfterViewInit {
	constructor(
		public el: ElementRef,
		public db: DatabaseService,
		private cd: ChangeDetectorRef,
		public loreService: LoreService,
		public databaseService: DatabaseService,
		private changeDetectorRef: ChangeDetectorRef
	) {
		// Initial timeframe is 4 weeks with the cursor being in the middle
		this.frameStart.base = moment
			.unix(loreService.cursor$.value)
			.clone()
			.subtract(2, 'week')
			.unix();
		this.frameEnd.base = moment
			.unix(loreService.cursor$.value)
			.clone()
			.add(2, 'week')
			.unix();

		console.log(`frame: ${this.frameEnd.total}`);

		this.calcUnitsBetween();
	}

	frameStart: DeltaProperty = new DeltaProperty(); // The frames starting point as unix
	frameEnd: DeltaProperty = new DeltaProperty();

	/**
	 * Returns the frames length in unix
	 */
	public get frame(): number {
		return this.frameEnd.total - this.frameStart.total;
	}

	offset: DeltaProperty = new DeltaProperty();

	unitsBetween: number; // This property holds how many main divisions there is on the timeline,
	// eg.: how many of the current scale's unit, fits into it.
	distanceBetweenUnits: number;
	// The resizeObserver keeps this property updated and call the change calculation
	public containerWidth: number;
	unit = 0;
	units: Array<{ unit: moment.unitOfTime.DurationConstructor; frame: number }> = [
		{ unit: 'day', frame: 7 },
		{ unit: 'week', frame: 4 },
		{ unit: 'month', frame: 12 }
	];

	@ViewChild('divisorContainer') divisorContainer: ElementRef;

	@ViewChild('cursor') cursor: CursorComponent;

	public actors$ = this.db.actors$(); // reference of the actor query pipeline

	logActors() {
		console.log('Logging actors:');
		this.actors$.pipe(take(1)).subscribe(console.log);
	}
	get currentUnit(): moment.unitOfTime.DurationConstructor {
		return this.units[this.unit].unit;
	}

	get currentUnitUpperlimit(): number {
		return this.units[this.unit].frame;
	}

	get getCurrentUnitInnerDivision(): number {
		return this.unit > 0 ? this.units[this.unit - 1].frame : 12;
	}

	ngAfterViewInit(): void {
		// ResizeObserver is not really supported outside of chrome.
		// It can also make the app crash on MacOS, here is a workaround: https://github.com/que-etc/resize-observer-polyfill/issues/36
		// this will keep the containerWidth property updated
		const resize$ = new ResizeObserver(e => {
			e.forEach(change => {
				this.containerWidth = change.contentRect.width;
				this.calcUnitsBetween();
				this.changeDetectorRef.detectChanges();
			});
		});
		resize$.observe(this.divisorContainer.nativeElement);
	}

	/**
	 * Idea is to when reach the bottom border, then scale down, and when reaching
	 * the upper boundary, raise the scale
	 * (Cant go up of days? go weeks, then months etc)
	 *
	 * Dynamic zoom. The change both effects frameStart and End based on cursor position
	 * TODO: Hammer pinch support
	 * @param $event mouseEvent
	 */
	@HostListener('mousewheel', ['$event'])
	scrollHandler($event: WheelEvent) {
		console.log($event);
		console.log(`this.unitsBetween ${this.unitsBetween}`);
		console.log('norm: ' + this.normalize($event.deltaY));
		console.log($event.deltaY);

		const direction = this.normalize($event.deltaY); // -1 or 1
		const prog = this.cursor.progress; // [0-1]
		console.log('prog' + prog);
		/*
		if (direction > 0 && this.unitsBetween === this.currentUnitUpperlimit && this.unit < this.units.length - 1) {
			this.unit++;
			console.log('upshift');
			// upshift
		} else if (direction < 0 && this.unitsBetween === 1 && this.unit > 0) {
			this.unit--;
			console.log('downshift');
			// downshift
		}*/

		// this.frameStart.subtract(direction * prog, this.currentUnit);
		// this.frameEnd.add(direction * (1 - prog), this.currentUnit);

		this.calcUnitsBetween();
		this.cursor.changed();
	}

	/**
	 * This method is called whenever a change has been made
	 * It calculates how many units there are in the frame, and the distance between them
	 */
	public calcUnitsBetween(): void {
		this.unitsBetween = moment.unix(this.frameEnd.total).diff(moment.unix(this.frameStart.total), this.currentUnit);
		console.log('this.unitsBetween' + this.unitsBetween);
		this.distanceBetweenUnits = this.containerWidth / this.unitsBetween;
	}

	/**
	 * distance from the left to the `i`th bar
	 */
	public dist(i: number) {
		return `${Math.round(this.offset.total + this.distanceBetweenUnits * i)}px`;
	}

	/**
	 * This is called by hammer pan events
	 *
	 * The purpose of this function is to translate the frame on the timeline.
	 * The size of the frame must not change while translating.
	 * Update the frameDeltas to the current offset distance converted to unix
	 * We essentially rescale the offset into the unix frame.
	 * Both delta are the same during translation
	 *
	 * When the translation finishes, the values are baked (Moved from the delta to the base value, total value doesn't change)
	 *
	 * Offset tracking:
	 * 1. map the offset directly modulo distance unit
	 * 2. On restarting it would mean that the offset always starts from 0. it should start where the previous ended
	 * 3. for this reason when the pan ends, we bake this delta back into the base value.
	 */
	public shift($event: any) {
		this.offset.delta = $event.deltaX;
		const delta = this.offset.total % this.distanceBetweenUnits;
		// When panning back, calculate the offset from the other side
		this.offset.delta = this.offset.total <= 0 ? this.distanceBetweenUnits + delta : delta;
		this.offset.delta -= this.offset.base;
		console.log(this.offset);
		console.log(`this.offset.total: ${this.offset.total}`);
		this.frameStart.delta = this.frameEnd.delta = -rescale($event.deltaX, 0, this.containerWidth, 0, this.frame);
		if ($event.type === 'panend') {
			this.frameStart.bake();
			this.frameEnd.bake();
			this.offset.bake();
		}
	}

	/**
	 * On click, jump with the cursor
	 */
	public tap($event: any) {
		new TWEEN.Tween(this.cursor)
			.to({ position: $event.center.x - this.el.nativeElement.offsetLeft }, 220)
			.easing(TWEEN.Easing.Exponential.Out)
			.onUpdate(a => {
				this.cursor.changed();
			})
			.start(Date.now());
	}

	ngOnInit() {}

	@HostBinding('style.width') get widthCalc(): string {
		return `calc(100% - ${this.el.nativeElement.offsetLeft}px)`;
	}

	normalize(value: number) {
		return value / Math.abs(value);
	}
}

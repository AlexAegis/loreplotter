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
import { switchMap, tap, take, filter } from 'rxjs/operators';
import { Actor } from 'src/app/model/actor.class';
import { LoreService } from 'src/app/service/lore.service';
import * as TWEEN from '@tweenjs/tween.js';
import { DeltaProperty } from 'src/app/model/delta-property.class';
import { normalize } from 'src/app/engine/helper/normalize.function';
import { rescale } from 'src/app/misc/rescale.function';
import { nextWhole } from 'src/app/engine/helper/nextWhole.function';

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

	public frameStart: DeltaProperty = new DeltaProperty(); // The frames starting point as unix
	public frameEnd: DeltaProperty = new DeltaProperty();

	/**
	 * Returns the frames length in unix
	 */
	public get frame(): number {
		return this.frameEnd.total - this.frameStart.total;
	}

	unitsBetween: number; // This property holds how many main divisions there is on the timeline,
	// eg.: how many of the current scale's unit, fits into it.
	distanceBetweenUnits: number;
	// The resizeObserver keeps this property updated and call the change calculation
	public containerWidth: number;
	currentUnitIndex = 0;
	units: Array<{ unitName: moment.unitOfTime.DurationConstructor; frame: number; seconds: number }> = [
		{ unitName: 'day', frame: 7, seconds: moment.duration(1, 'day').asSeconds() },
		{ unitName: 'week', frame: 4, seconds: moment.duration(1, 'week').asSeconds() },
		{ unitName: 'month', frame: 12, seconds: moment.duration(1, 'month').asSeconds() }
	];

	@ViewChild('divisorContainer') divisorContainer: ElementRef;

	@ViewChild('cursor') cursor: CursorComponent;

	public actors$ = this.databaseService.actors$; // reference of the actor query pipeline

	logActors() {
		console.log('Logging actors:');
		this.actors$.pipe(take(1)).subscribe(console.log);
	}
	get currentUnit(): moment.unitOfTime.DurationConstructor {
		return this.units[this.currentUnitIndex].unitName;
	}

	get currentUnitSeconds(): number {
		return this.units[this.currentUnitIndex].seconds;
	}

	get currentUnitUpperlimit(): number {
		return this.units[this.currentUnitIndex].frame;
	}

	get getCurrentUnitInnerDivision(): number {
		return this.currentUnitIndex > 0 ? this.units[this.currentUnitIndex - 1].frame : 12;
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
	scrollHandler($event: any) {
		const direction = this.normalize($event.deltaY); // -1 or 1
		let prog = this.cursor.progress; // [0-1]

		prog = rescale($event.clientX, 0, window.innerWidth, 0, 1);
		// This will be the cursor positon or the center of the pinch, right now it's just the cursors position

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
		this.frameStart.base -= direction * prog * this.currentUnitSeconds;
		this.frameEnd.base += direction * (1 - prog) * this.currentUnitSeconds;

		this.calcUnitsBetween();
		this.cursor.changed();
	}

	/**
	 * This method is called whenever a change has been made
	 * It calculates how many units there are in the frame, and the distance between them
	 */
	public calcUnitsBetween(): void {
		this.unitsBetween = this.frame / this.currentUnitSeconds;
		this.distanceBetweenUnits = this.containerWidth / this.unitsBetween;
	}

	/**
	 * distance from the left to the `i`th bar
	 */
	public dist(i: number): number {
		const time = nextWhole(this.frameStart.total, this.currentUnitSeconds, i + 1);
		return rescale(time, this.frameStart.total, this.frameEnd.total, 0, this.containerWidth);
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
	 */
	@HostListener('panstart', ['$event'])
	@HostListener('pan', ['$event'])
	@HostListener('panend', ['$event'])
	public shift($event: any) {
		// $event.stopPropagation();
		this.frameStart.delta = this.frameEnd.delta = -rescale($event.deltaX, 0, this.containerWidth, 0, this.frame);
		if ($event.type === 'panend') {
			this.frameStart.bake();
			this.frameEnd.bake();
		}
	}

	/**
	 * On click, jump with the cursor
	 */
	public tap($event: any) {
		this.easeCursorTo($event.center.x - this.el.nativeElement.offsetLeft);
	}

	public easeCursorTo(position: number) {
		new TWEEN.Tween(this.cursor)
			.to({ position: position }, 220)
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
		return value === 0 ? 0 : value / Math.abs(value);
	}

	public playOrPause(play: boolean) {
		if (play) {
			this.play();
		} else {
			this.pause();
		}
	}

	public play() {
		console.log('play!');
		this.loreService.play(this.cursor);
	}

	public pause() {
		console.log('pause!');
		this.loreService.stopSubject.next(true);
	}
}

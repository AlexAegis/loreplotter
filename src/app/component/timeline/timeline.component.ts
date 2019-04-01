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

@Component({
	selector: 'app-timeline',
	templateUrl: './timeline.component.html',
	styleUrls: ['./timeline.component.scss']
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit, AfterViewInit {
	get currentUnit(): moment.unitOfTime.DurationConstructor {
		return this.units[this.unit].unit;
	}

	get currentUnitUpperlimit(): number {
		return this.units[this.unit].frame;
	}

	get getCurrentUnitInnerDivision(): number {
		return this.unit > 0 ? this.units[this.unit - 1].frame : 12;
	}

	constructor(
		public el: ElementRef,
		public db: DatabaseService,
		private cd: ChangeDetectorRef,
		public loreService: LoreService
	) {
		this.beginning = loreService.cursor$.value.clone();
		console.log(`beg unix before add: ${this.beginning.unix()}`);
		this.frame = this.beginning.clone();
		this.frame = this.frame.add(1, 'months');
		console.log(`beg unix after add: ${this.beginning.unix()}`);
		console.log(`frame: ${this.frame.unix()}`);

		this.calcUnitsBetween();

		this.countRef = db.loreCount$();
		this.actors$ = db.actors$('TestProject');
	}
	beginning: Moment;
	frame: Moment;
	cursorTime: Moment;
	unitsBetween: number;
	distanceBetweenUnits: number;
	width: number;
	unit = 0;
	private _offset = 0;
	private _deltaOffset = 0;
	units: Array<{ unit: moment.unitOfTime.DurationConstructor; frame: number }> = [
		{ unit: 'day', frame: 7 },
		{ unit: 'week', frame: 4 },
		{ unit: 'month', frame: 12 }
	];

	@ViewChild('divisorContainer') divisorContainer: ElementRef;

	@ViewChild('cursor') cursor: CursorComponent;

	public countRef;
	public actors$;

	get totalOffset(): number {
		return this._offset + this._deltaOffset;
	}

	logActors() {
		console.log('Logging actors:');
		this.actors$.pipe(take(1)).subscribe(console.log);
	}

	ngAfterViewInit(): void {
		// ResizeObserver is not really supported outside of chrome.
		// It can also make the app crash on MacOS https://github.com/que-etc/resize-observer-polyfill/issues/36
		const resize$ = new ResizeObserver(e => {
			e.forEach(change => {
				this.width = change.contentRect.width;
				console.log(this.width);
				this.calcUnitsBetween();
			});
		});
		resize$.observe(this.divisorContainer.nativeElement);
		this.width = this.divisorContainer.nativeElement.offsetWidth;
		console.log(this.width);
	}

	/**
	 * Idea is to when reach the bottom border, then scale down, and when reaching
	 * the upper boundary, raise the scale
	 * (Cant go up of days? go weeks, then months etc)
	 * @param $event mouseEvent
	 */
	@HostListener('mousewheel', ['$event'])
	scrollHandler($event: WheelEvent) {
		console.log($event);
		console.log(`this.unitsBetween ${this.unitsBetween}`);

		if (
			$event.deltaY > 0 &&
			this.unitsBetween === this.currentUnitUpperlimit &&
			this.unit < this.units.length - 1
		) {
			this.unit++;
			console.log('upshift');
			// upshift
		} else if ($event.deltaY < 0 && this.unitsBetween === 1 && this.unit > 0) {
			this.unit--;
			console.log('downshift');
			// downshift
		}

		if (
			(this.unitsBetween > 1 && $event.deltaY < 0) ||
			($event.deltaY > 0 && this.unitsBetween < this.currentUnitUpperlimit)
		) {
			this.frame.add(this.normalize($event.deltaY), this.currentUnit);
			// this.beginning.subtract(this.normalize($event.deltaY), this.unit);
		}

		this.calcUnitsBetween();
	}

	calcUnitsBetween(): void {
		this.unitsBetween = this.frame.diff(this.beginning, this.currentUnit);
		console.log(this.unitsBetween);
		this.distanceBetweenUnits = this.width / this.unitsBetween;
	}

	/**
	 * distance from the left for the `i`th bar
	 */
	dist(i: number) {
		return `${Math.round(this.totalOffset + this.distanceBetweenUnits * i)}px`;
	}

	shift($event: any) {
		this._deltaOffset = $event.deltaX;
		const whole = this.totalOffset / this.distanceBetweenUnits;
		if (whole > 1) {
			this.beginning = this.beginning.add(-1, this.currentUnit);
			this.frame = this.frame.add(-1, this.currentUnit);
			this._offset -= this.distanceBetweenUnits;
		}

		if (whole < 0) {
			this.beginning = this.beginning.add(1, this.currentUnit);
			this.frame = this.frame.add(1, this.currentUnit);
			this._offset += this.distanceBetweenUnits;
		}

		if ($event.isFinal) {
			this._offset = this.totalOffset;
			this._deltaOffset = 0;
		}
	}

	/**
	 * On click, jump with the cursor
	 */
	tap($event: any) {
		new TWEEN.Tween(this.cursor)
			.to({ position: $event.center.x - this.totalOffset - this.el.nativeElement.offsetLeft }, 220)
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

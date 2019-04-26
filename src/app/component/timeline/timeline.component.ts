import { BlockService } from './../block/block.service';
import { Vector3Serializable } from './../../model/vector3-serializable.interface';
import { BlockComponent } from './../block/block.component';
import { Actor } from 'src/app/model/actor.class';
import { ClickEvent } from './../../engine/event/click-event.type';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	OnInit,
	ViewChild,
	ViewChildren,
	QueryList,
	Query
} from '@angular/core';
import * as TWEEN from '@tweenjs/tween.js';
import * as moment from 'moment';
import ResizeObserver from 'resize-observer-polyfill';
import { take, switchMap, flatMap, filter, tap, finalize } from 'rxjs/operators';
import { DatabaseService } from 'src/app/database/database.service';
import { nextWhole } from 'src/app/engine/helper/nextWhole.function';
import { DeltaProperty } from 'src/app/model/delta-property.class';
import { LoreService } from 'src/app/service/lore.service';

import { CursorComponent } from './../cursor/cursor.component';
import { NgScrollbar } from 'ngx-scrollbar';
import * as THREE from 'three';
import { ActorDelta } from 'src/app/model/actor-delta.class';
import { UnixWrapper } from 'src/app/model/unix-wrapper.class';
import { loreSchema } from 'src/app/model/lore.class';
import { RxDocument } from 'rxdb';

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
	@ViewChildren(BlockComponent)
	public blocks: QueryList<BlockComponent>;

	constructor(
		public el: ElementRef,
		public db: DatabaseService,
		public loreService: LoreService,
		public databaseService: DatabaseService,
		public blockService: BlockService,
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

		this.calcUnitsBetween();
	}

	/**
	 * Returns the frames length in unix
	 */
	public get frame(): number {
		return this.frameEnd.total - this.frameStart.total;
	}
	get currentUnit(): moment.unitOfTime.DurationConstructor {
		return this.units[this.currentUnitIndex].unitName;
	}

	get currentUnitSeconds(): number {
		return this.units[this.currentUnitIndex].seconds;
	}

	get currentUnitDivision(): number {
		return this.units[this.currentUnitIndex].frame;
	}

	get previousUnitDivision(): number {
		return this.currentUnitIndex > 0 ? this.units[this.currentUnitIndex - 1].frame : -Infinity;
	}

	get nextUnitDivision(): number {
		return this.currentUnitIndex < this.units.length - 1 ? this.units[this.currentUnitIndex + 1].frame : Infinity;
	}

	@HostBinding('style.width') get widthCalc(): string {
		return `calc(100% - ${this.el.nativeElement.offsetLeft}px)`;
	}
	noOverflow = 'noOverflow';

	public frameStart: DeltaProperty = new DeltaProperty(); // The frames starting point as unix
	public frameEnd: DeltaProperty = new DeltaProperty();

	public unitsBetween: number; // This property holds how many main divisions there is on the timeline,

	// eg.: how many of the current scale's unit, fits into it.
	distanceBetweenUnits: number;
	// The resizeObserver keeps this property updated and call the change calculation
	public containerWidth: number;
	currentUnitIndex = 3;
	units: Array<{ unitName: moment.unitOfTime.DurationConstructor; frame: number; seconds: number }> = [
		{ unitName: 'second', frame: 1000, seconds: moment.duration(1, 'second').asSeconds() },
		{ unitName: 'minute', frame: 60, seconds: moment.duration(1, 'minute').asSeconds() },
		{ unitName: 'hour', frame: 60, seconds: moment.duration(1, 'hour').asSeconds() },
		{ unitName: 'day', frame: 24, seconds: moment.duration(1, 'day').asSeconds() },
		{ unitName: 'week', frame: 7, seconds: moment.duration(1, 'week').asSeconds() },
		{ unitName: 'month', frame: 52, seconds: moment.duration(1, 'month').asSeconds() },
		{ unitName: 'year', frame: 12, seconds: moment.duration(1, 'year').asSeconds() }
	];

	@ViewChild('divisorContainer') divisorContainer: ElementRef;

	@ViewChild('cursor') cursor: CursorComponent;

	public actors$ = this.databaseService.currentLoreActors$.pipe(
		tap(next => {
			this.blocks.forEach(block => {
				block.cd.markForCheck();
				block.cd.detectChanges();
			});
		})
	); // reference of the actor query pipeline

	@ViewChild(NgScrollbar) private scrollRef: NgScrollbar;

	private scrollOnStart: number;

	private panTypeAtStart: string;

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
	// @HostListener('mousewheel', ['$event'])
	scrollHandler($event: any) {
		const direction = this.normalize($event.deltaY); // -1 or 1
		let prog = this.cursor.progress; // [0-1]

		prog = THREE.Math.mapLinear($event.clientX, 0, window.innerWidth, 0, 1);
		/*console.log(
			`prog: ${prog} currentUnitUpperlimit: ${this.currentUnitDivision} nextUnitDivision: ${
				this.nextUnitDivision
			} currentUnitIndex: ${this.currentUnitIndex} unitsBetween: ${this.unitsBetween}`
		);*/
		// This will be the cursor positon or the center of the pinch, right now it's just the cursors position

		if (
			direction > 0 &&
			this.nextUnitDivision <= this.unitsBetween &&
			this.currentUnitIndex < this.units.length - 1
		) {
			// this.currentUnitIndex++;
			console.log('upshift');
			// upshift
		} else if (direction < 0 && this.currentUnitDivision >= this.unitsBetween && this.currentUnitIndex > 0) {
			// this.currentUnitIndex--;
			console.log('downshift');
			// downshift
		}
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
		return (
			THREE.Math.mapLinear(time, this.frameStart.total, this.frameEnd.total, 0, this.containerWidth) -
			this.distanceBetweenUnits * 0.042 - // TODO: Change this magic number into something reasonable (although it works)
			this.distanceBetweenUnits
		);
	}

	public subDist(i: number) {
		return (this.distanceBetweenUnits / this.currentUnitDivision) * (i + 1);
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
	@HostListener('panleft', ['$event'])
	@HostListener('panright', ['$event'])
	@HostListener('panup', ['$event'])
	@HostListener('pandown', ['$event'])
	@HostListener('panend', ['$event'])
	public shift($event: any) {
		$event.stopPropagation();
		this.blockService.selection.next(undefined);
		if ($event.type === 'panstart') {
			this.scrollOnStart = this.scrollRef.view.scrollTop;
		}
		if (!this.panTypeAtStart) {
			if ($event.type === 'panup' || $event.type === 'pandown') {
				this.panTypeAtStart = 'vertical';
			} else if ($event.type === 'panleft' || $event.type === 'panright') {
				this.panTypeAtStart = 'horizontal';
			}
		}

		if (this.panTypeAtStart === 'vertical') {
			this.scrollRef.scrollYTo(this.scrollOnStart - $event.deltaY);
		} else {
			this.frameStart.delta = this.frameEnd.delta = -THREE.Math.mapLinear(
				$event.deltaX,
				0,
				this.containerWidth,
				0,
				this.frame
			);
		}

		if ($event.type === 'panend') {
			this.panTypeAtStart = undefined;
			this.frameStart.bake();
			this.frameEnd.bake();
		}
	}

	/**
	 * On click, jump with the cursor
	 */
	public tap($event: any) {
		$event.stopPropagation();
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

	normalize(value: number) {
		return value === 0 ? 0 : value / Math.abs(value);
	}

	public spawnNode($event: any, actor: RxDocument<Actor>, block: BlockComponent) {
		$event.stopPropagation();
		block.isSaving = true;
		const unix = THREE.Math.mapLinear(
			$event.center.x - this.el.nativeElement.offsetLeft,
			0,
			this.containerWidth,
			this.frameStart.total,
			this.frameEnd.total
		);
		const wrapper = new UnixWrapper(unix);
		const enclosing = actor.states.enclosingNodes(wrapper);
		let finalPosition: Vector3Serializable;
		if (enclosing.first === undefined || enclosing.last === undefined) {
			let node = enclosing.first;
			if (!node) {
				node = enclosing.last;
			}
			finalPosition = {
				x: node.value.position.x,
				y: node.value.position.y,
				z: node.value.position.z
			};
		} else {
			const progress = this.loreService.progress(enclosing, unix);
			const worldPos = this.loreService.lookAtInterpolated(enclosing, progress);
			finalPosition = { x: worldPos.x, y: worldPos.y, z: worldPos.z };
		}

		actor.states.set(wrapper, new ActorDelta(undefined, finalPosition));
		actor
			.atomicUpdate(a => (a.states = actor.states) && a)
			.then()
			.finally(() => {
				block.isSaving = false;
				block.cd.markForCheck();
				block.cd.detectChanges();
			});
	}

	public playOrPause(play: boolean) {
		if (play) {
			this.play();
		} else {
			this.pause();
		}
	}

	public play() {
		this.loreService.play(this.cursor);
	}

	public pause() {
		this.loreService.stopSubject.next(true);
	}
}

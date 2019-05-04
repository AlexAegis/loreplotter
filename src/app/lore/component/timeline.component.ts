import { BlockService } from '@lore/service';
import { BlockComponent } from './block.component';
import { Actor } from '@app/model/data/actor.class';
import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	OnInit,
	ViewChild,
	ViewChildren,
	QueryList,
	ChangeDetectionStrategy
} from '@angular/core';
import { Easing, Tween } from '@tweenjs/tween.js';
import moment from 'moment';
import ResizeObserver from 'resize-observer-polyfill';
import {
	tap,
	auditTime,
	map,
	throttleTime,
	takeUntil,
	first,
	takeLast,
	withLatestFrom,
	delayWhen,
	share,
	throttle,
	audit,
	skipWhile,
	takeWhile,
	debounce,
	filter,
	mergeMap,
	take,
	mapTo,
	last
} from 'rxjs/operators';
import { DatabaseService } from '@app/service/database.service';
import { DeltaProperty } from '@app/model/delta-property.class';
import { LoreService } from '@app/service/lore.service';
import { Math as ThreeMath } from 'three';
import { CursorComponent } from './cursor.component';
import { NgScrollbar } from 'ngx-scrollbar';
import { ActorDelta, UnixWrapper } from '@app/model/data';
import { RxDocument } from 'rxdb';
import { BehaviorSubject, combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { tweenMap } from '@app/operator';
import { nextWhole } from '@app/function';
import { StoreFacade } from '@lore/store/store-facade.service';
import { findLast } from '@angular/compiler/src/directive_resolver';

/**
 * Timeline
 *
 * Has a frame-start and a frame end which together describe a time-frame of which time is displayed in this Component
 *
 * It also has a dynamic scale factor which changes depending on the size of the frame.
 * The frame's scale is always one above the largest time unit the frame encapsulates.
 * For example, if the frame is just larger than a month, then the scale would be one below that. A week.
 * The start and end positions, along with the scale then determines how the scale will be divided. And end how many parts.
 *
 */
@Component({
	selector: 'app-timeline',
	templateUrl: './timeline.component.html',
	styleUrls: ['./timeline.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineComponent implements OnInit, AfterViewInit {
	constructor(
		public el: ElementRef,
		public db: DatabaseService,
		public loreService: LoreService,
		public databaseService: DatabaseService,
		public blockService: BlockService,
		private storeFacade: StoreFacade,
		private changeDetectorRef: ChangeDetectorRef
	) {
		this.cursor$ = this.loreService.dampenedCursor$;
		/*	cursorCo  mponent.contextChange();
						if (speed > 0 && cursorComponent.progress > 0.8) {
							this.autoFrameShift$.next(1);
							// jump forward with the frame
						 } else if (speed < 0 && cursorComponent.progress < 0.2) {
							// jump backward with the frame
							this.autoFrameShift$.next(-1);
						}*/

		this.loreService.autoFrameShift$
			.pipe(
				throttleTime(500),
				withLatestFrom(this.storeFacade.frame$),
				map(([i, frame]) => {
					return {
						from: { base: frame.start, length: frame.length },
						to: {
							base: frame.start + i * frame.length * 0.5,
							length: frame.length
						}
					};
				}),
				tweenMap({
					duration: 500,
					easing: Easing.Exponential.Out,
					pingpongInterrupt: true,
					pingpongAfterFinish: true
				}),
				auditTime(1000 / 60)
			)
			.subscribe(({ base, length }) => {
				this.storeFacade.setFrame({ start: base, end: base + length });

				// this.cursor.contextChange();
				this.changeDetectorRef.markForCheck();
			});
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
	@ViewChildren(BlockComponent)
	public blocks: QueryList<BlockComponent>;

	public cursor$: Observable<number>;
	noOverflow = 'noOverflow';

	public unitsBetween = 100; // This property holds how many main divisions there is on the timeline,

	// eg.: how many of the current scale's unit, fits into it.
	public distanceBetweenUnits: number;
	// The resizeObserver keeps this property updated and call the change calculation
	public containerWidth = new ReplaySubject<number>(1);
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

	// TODO: Into sideeffect
	public actors$ = this.databaseService.currentLoreActors$.pipe(
		tap(next => {
			this.blocks.forEach(block => {
				block.cd.markForCheck();
				block.cd.detectChanges();
			});
		})
	); // reference of the actor query pipeline

	@ViewChild(NgScrollbar)
	private scrollRef: NgScrollbar;

	private scrollOnStart: number;

	private panTypeAtStart: string;

	private easeCursorTo = new Subject<number>();

	private easeCursorToSubscription = this.easeCursorTo
		.pipe(
			withLatestFrom(
				this.storeFacade.cursorUnix$,
				this.storeFacade.frameStart$,
				this.storeFacade.frameEnd$,
				this.containerWidth
			),
			map(([position, cursor, frameStart, frameEnd, containerWidth]) => ({
				from: { cursor: cursor },
				to: { cursor: ThreeMath.mapLinear(position, 0, containerWidth, frameStart, frameEnd) }
			})),
			tweenMap({
				duration: 220,
				easing: Easing.Exponential.Out,
				pingpongInterrupt: true,
				pingpongAfterFinish: false,
				sendUndefined: true,
				doOnNext: next => {
					if (next) {
						this.storeFacade.setCursorOverride(next.cursor);
					}
				},
				doOnComplete: () => {
					this.storeFacade.bakeCursorOverride();
				}
			})
		)
		.subscribe();

	public firstDist$ = combineLatest([this.storeFacade.frame$, this.containerWidth]).pipe(
		map(([frame, containerWidth]) => {
			this.unitsBetween = frame.length / this.currentUnitSeconds;
			this.distanceBetweenUnits = containerWidth / this.unitsBetween;
			const time = nextWhole(frame.start, this.currentUnitSeconds);
			return (
				ThreeMath.mapLinear(time, frame.start, frame.end, 0, containerWidth) - this.distanceBetweenUnits * 1.042
				// TODO: Change this magic number into something reasonable (although it works)
				// substracting it once is necessary because of the subdividers (it has to be negative)
			);
		}),
		share()
	);

	public nodeSpawner = new Subject<{ $event: any; actor: RxDocument<Actor>; block: BlockComponent }>();

	public spawnNodeSubsciption = this.nodeSpawner
		.pipe(
			tap(({ $event }) => $event.stopPropagation()),
			withLatestFrom(this.storeFacade.frame$, this.containerWidth),
			map(([{ $event, actor, block }, frame, containerWidth]) => {
				const unix = ThreeMath.mapLinear(
					$event.center.x - this.el.nativeElement.offsetLeft,
					0,
					containerWidth,
					frame.start,
					frame.end
				);

				const position = this.loreService.actorPositionAt(actor, unix);
				// Todo make this save a sideeffect and control the block with that
				actor._states.set(new UnixWrapper(unix), new ActorDelta(undefined, position));
				block.isSaving = true;
				actor
					.atomicUpdate(a => (a._states = actor._states) && a)
					.then(a => {
						block.isSaving = false;
						block.actor = a;
					});
			})
		)
		.subscribe();

	public frameShifter = new Subject<number>();
	public frameShifterSubscription = this.frameShifter
		.pipe(withLatestFrom(this.storeFacade.frame$, this.containerWidth))
		.subscribe(([shift, frame, containerWidth]) => {
			if (shift !== undefined) {
				this.storeFacade.setFrameDelta(-ThreeMath.mapLinear(shift, 0, containerWidth, 0, frame.length));
			} else {
				this.storeFacade.bakeFrame();
			}
		});

	static normalize(value: number) {
		return value === 0 ? 0 : value / Math.abs(value);
	}

	ngAfterViewInit(): void {
		this.containerWidth.next(this.el.nativeElement.offsetWidth); // Initial value
		// ResizeObserver is not really supported outside of chrome.
		// It can also make the app crash on MacOS, here is a workaround: https://github.com/que-etc/resize-observer-polyfill/issues/36
		// this will keep the containerWidth property updated
		const resize$ = new ResizeObserver(e => {
			e.forEach(change => {
				this.containerWidth.next(change.contentRect.width);
				this.changeDetectorRef.detectChanges();
			});
		});
		resize$.observe(this.divisorContainer.nativeElement);
	}

	/**
	 * Idea is end when reach the bottom border, then scale down, and when reaching
	 * the upper boundary, raise the scale
	 * (Cant go up of days? go weeks, then months etc)
	 *
	 * Dynamic zoom. The change both effects frameStart and End based on cursor position
	 * TODO: Hammer pinch support
	 * @param $event mouseEvent
	 */
	// @HostListener('mousewheel', ['$event'])
	scrollHandler($event: any) {
		const direction = TimelineComponent.normalize($event.deltaY); // -1 or 1

		const prog = ThreeMath.mapLinear($event.clientX, 0, window.innerWidth, 0, 1);
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

		this.storeFacade.changeFrameBy({
			start: -direction * prog * this.currentUnitSeconds,
			end: direction * (1 - prog) * this.currentUnitSeconds
		});

		// this.cursor.changed();
		// this.cursor.contextChange();
	}

	/**
	 * distance start the left end the `i`th bar
	 */
	public deltaDist(i: number): number {
		return this.distanceBetweenUnits * i;
	}

	public subDist(i: number) {
		return (this.distanceBetweenUnits / this.currentUnitDivision) * (i + 1);
	}

	/**
	 * This is called by hammer pan events
	 *
	 * The purpose of this function is end translate the frame on the timeline.
	 * The size of the frame must not change while translating.
	 * Update the frameDeltas end the current offset distance converted end unix
	 * We essentially rescale the offset into the unix frame.
	 * Both delta are the same during translation
	 *
	 * When the translation finishes, the values are baked (Moved start the delta end the base value, total value doesn't change)
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
			this.frameShifter.next($event.deltaX);
		}

		if ($event.type === 'panend') {
			this.panTypeAtStart = undefined;
			this.frameShifter.next(undefined);
		}
	}

	/**
	 * On click, jump with the cursor
	 */
	public tap($event: any) {
		$event.stopPropagation();
		this.easeCursorTo.next($event.center.x - this.el.nativeElement.offsetLeft);
	}

	ngOnInit() {}

	spawnNode($event: any, actor: RxDocument<Actor>, block: BlockComponent) {
		this.nodeSpawner.next({ $event, actor, block });
	}

	toPx(number: number) {
		return `${number}px`;
	}
}

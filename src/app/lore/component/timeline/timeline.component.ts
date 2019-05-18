import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	OnInit,
	QueryList,
	ViewChild,
	ViewChildren
} from '@angular/core';
import { BaseDirective } from '@app/component/base-component.class';
import { nextWhole } from '@app/function';
import { toUnit } from '@app/function/to-unit.function';
import { ActorDelta, UnixWrapper } from '@app/model/data';
import { Actor } from '@app/model/data/actor.class';
import { tweenMap } from '@app/operator';
import { ActorAccumulator, ActorService } from '@app/service';
import { DatabaseService } from '@app/service/database.service';
import { LoreService } from '@app/service/lore.service';
import { BlockComponent } from '@lore/component/timeline/block.component';
import { CursorComponent } from '@lore/component/timeline/cursor.component';
import { BlockService } from '@lore/service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Easing } from '@tweenjs/tween.js';
import moment from 'moment';
import { NgScrollbar } from 'ngx-scrollbar';
import ResizeObserver from 'resize-observer-polyfill';
import { RxDocument } from 'rxdb';
import { combineLatest, Observable, ReplaySubject, Subject } from 'rxjs';
import { map, share, tap, withLatestFrom } from 'rxjs/operators';
import { Math as ThreeMath } from 'three';

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
export class TimelineComponent extends BaseDirective implements OnInit, AfterViewInit {
	public cursorUnix$: Observable<number>;
	public actorDeltasAtCursor$: Observable<Array<ActorAccumulator>>;

	public constructor(
		public el: ElementRef,
		public db: DatabaseService,
		public loreService: LoreService,
		public databaseService: DatabaseService,
		public blockService: BlockService,
		private storeFacade: StoreFacade,
		private actorService: ActorService,
		private changeDetectorRef: ChangeDetectorRef
	) {
		super();
		this.cursorUnix$ = this.storeFacade.cursor$;
		this.actorDeltasAtCursor$ = this.actorService.actorDeltasAtCursor$;
	}

	public get currentUnit(): moment.unitOfTime.DurationConstructor {
		return this.units[this.currentUnitIndex].unitName;
	}

	public get currentUnitSeconds(): number {
		return this.units[this.currentUnitIndex].seconds;
	}

	public get currentUnitDivision(): number {
		return this.units[this.currentUnitIndex].frame;
	}

	public get previousUnitDivision(): number {
		return this.currentUnitIndex > 0 ? this.units[this.currentUnitIndex - 1].frame : -Infinity;
	}

	public get nextUnitDivision(): number {
		return this.currentUnitIndex < this.units.length - 1 ? this.units[this.currentUnitIndex + 1].frame : Infinity;
	}

	@HostBinding('style.width')
	public get widthCalc(): string {
		return `calc(100% - ${this.el.nativeElement.offsetLeft}px)`;
	}

	@ViewChildren(BlockComponent)
	public blocks: QueryList<BlockComponent>;

	public unitsBetween = 100; // This property holds how many main divisions there is on the timeline,

	// eg.: how many of the current scale's unit, fits into it.
	public distanceBetweenUnits: number;
	// The resizeObserver keeps this property updated and call the change calculation
	public containerWidth = new ReplaySubject<number>(1);
	public currentUnitIndex = 3;
	public units: Array<{ unitName: moment.unitOfTime.DurationConstructor; frame: number; seconds: number }> = [
		{ unitName: 'second', frame: 1000, seconds: moment.duration(1, 'second').asSeconds() },
		{ unitName: 'minute', frame: 60, seconds: moment.duration(1, 'minute').asSeconds() },
		{ unitName: 'hour', frame: 60, seconds: moment.duration(1, 'hour').asSeconds() },
		{ unitName: 'day', frame: 24, seconds: moment.duration(1, 'day').asSeconds() },
		{ unitName: 'week', frame: 7, seconds: moment.duration(1, 'week').asSeconds() },
		{ unitName: 'month', frame: 52, seconds: moment.duration(1, 'month').asSeconds() },
		{ unitName: 'year', frame: 12, seconds: moment.duration(1, 'year').asSeconds() }
	];

	@ViewChild('divisorContainer')
	public divisorContainer: ElementRef;

	@ViewChild('cursor')
	public cursor: CursorComponent;

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

	public firstDist$ = combineLatest([this.storeFacade.frame$, this.containerWidth]).pipe(
		map(([frame, containerWidth]) => {
			this.unitsBetween = frame.length / this.currentUnitSeconds;
			this.distanceBetweenUnits = containerWidth / this.unitsBetween;
			const time = nextWhole(frame.start, this.currentUnitSeconds);
			return (
				ThreeMath.mapLinear(time, frame.start, frame.end, 0, containerWidth) -
				this.distanceBetweenUnits -
				this.distanceBetweenUnits / 12
				// TODO: I don't know why but it's shifted by exactly two hours
			);
		}),
		share()
	);

	public nodeSpawner = new Subject<{ $event: any; actor: RxDocument<Actor>; block: BlockComponent }>();

	public frameShifter = new Subject<number>();

	public ngAfterViewInit(): void {
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
	public zoomScrollHandler($event: any): void {
		const direction = toUnit($event.deltaY); // -1 or 1
		const prog = ThreeMath.mapLinear($event.clientX, 0, window.innerWidth, 0, 1);
		// This will be the cursor position or the center of the pinch, right now it's just the cursors position
		/*
		if (
			direction > 0 &&
			this.nextUnitDivision <= this.unitsBetween &&
			this.currentUnitIndex < this.units.length - 1
		) {
			// this.currentUnitIndex++;
			// upshift
		} else if (direction < 0 && this.currentUnitDivision >= this.unitsBetween && this.currentUnitIndex > 0) {
			// this.currentUnitIndex--;
			// downshift
		}*/

		this.storeFacade.changeFrameBy({
			start: -direction * prog * this.currentUnitSeconds,
			end: direction * (1 - prog) * this.currentUnitSeconds
		});
	}

	/**
	 * Handles the scroll on the timeline to move the view of the channels up and down
	 * @param $event input from hammer
	 */
	public scrollHandler($event: HammerInput): void {
		this.scrollRef.scrollYTo(this.scrollRef.view.scrollTop + toUnit($event.deltaY) * 40);
	}

	/**
	 * distance start the left end the `i`th bar
	 */
	public deltaDist(i: number): number {
		return this.distanceBetweenUnits * i;
	}

	public subDist(i: number): number {
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
	public shift($event: any): void {
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
	public tap($event: any): void {
		$event.stopPropagation();
		this.easeCursorTo.next($event.center.x - this.el.nativeElement.offsetLeft);
	}

	public ngOnInit(): void {
		this.teardown = this.easeCursorTo
			.pipe(
				withLatestFrom(this.storeFacade.cursor$, this.storeFacade.frame$, this.containerWidth),
				map(([position, cursor, { start, end }, containerWidth]) => ({
					from: { cursor: cursor },
					to: { cursor: ThreeMath.mapLinear(position, 0, containerWidth, start, end) }
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

		this.teardown = this.frameShifter
			.pipe(withLatestFrom(this.storeFacade.frame$, this.containerWidth))
			.subscribe(([shift, frame, containerWidth]) => {
				if (shift !== undefined) {
					this.storeFacade.setFrameDelta(-ThreeMath.mapLinear(shift, 0, containerWidth, 0, frame.length));
				} else {
					this.storeFacade.bakeFrame();
				}
			});

		this.teardown = this.nodeSpawner
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
					const position = this.actorService.actorPositionAt(actor, unix);
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
	}

	public spawnNode($event: any, actor: RxDocument<Actor>, block: BlockComponent): void {
		this.nodeSpawner.next({ $event, actor, block });
	}

	public toPx(number: number): string {
		return `${number}px`;
	}
}

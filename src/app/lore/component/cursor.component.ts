import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	Input,
	OnInit
} from '@angular/core';
import { Math as ThreeMath } from 'three';
import { combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { StoreFacade } from '@lore/store/store-facade.service';
import { filter, map, withLatestFrom } from 'rxjs/operators';

@Component({
	selector: 'app-cursor',
	templateUrl: './cursor.component.html',
	styleUrls: ['./cursor.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CursorComponent implements OnInit, AfterViewInit {

	/**
	 * Still needed to protect agains out of bounds problems
	 *
	 * @param width of the parent container
	 */
	@Input('containerWidth')
	public containerWidth: Subject<number>;

	public frame$: Observable<{ start: number; end: number; length: number }>;
	public cursorUnix$: Observable<number>;

	public progress$: Observable<number>;

	public progressSubscription: Subscription;

	@HostBinding('style.left.%')
	public progress;

	public panStartPosition: number;
	private shifter = new Subject<number>();
	private shifterSubscription: Subscription;

	constructor(private storeFacade: StoreFacade, private cd: ChangeDetectorRef, private el: ElementRef) {
		this.frame$ = this.storeFacade.frame$;
		this.cursorUnix$ = this.storeFacade.cursorUnix$;
	}

	public ngOnInit() {
		this.progress$ = combineLatest([this.frame$, this.cursorUnix$]).pipe(
			map(([{ start, end }, unix]) => ThreeMath.mapLinear(unix, start, end, 0, 1))
		);

		this.progressSubscription = this.progress$.subscribe(next => {
			this.progress = next * 100;
		});

		this.shifterSubscription = this.shifter
			.pipe(
				withLatestFrom(this.containerWidth),
				filter(
					([cursoroverride, containerWidth]) =>
						cursoroverride === undefined ||
						(this.panStartPosition + cursoroverride >= 0 &&
							this.panStartPosition + cursoroverride <= containerWidth)
				), // Out of bounds check
				withLatestFrom(this.frame$),
				map(([[pos, containerWidth], frame]) => {
					return ThreeMath.mapLinear(
						this.panStartPosition + pos,
						0,
						containerWidth,
						frame.start,
						frame.end
					);
				})
			)
			.subscribe(cursoroverride => {
				this.storeFacade.setCursorOverride(cursoroverride);
			});
	}

	@HostListener('panstart', ['$event'])
	@HostListener('panleft', ['$event'])
	@HostListener('panright', ['$event'])
	@HostListener('panup', ['$event'])
	@HostListener('pandown', ['$event'])
	@HostListener('panend', ['$event'])
	public panHandler($event: any) {
		$event.stopPropagation();
		if ($event.type === 'panstart') {
			this.panStartPosition = this.el.nativeElement.offsetLeft;
		}
		this.shifter.next($event.deltaX);
		if ($event.type === 'panend') {
			this.storeFacade.bakeCursorOverride();
		}
	}

	public ngAfterViewInit(): void {}
}

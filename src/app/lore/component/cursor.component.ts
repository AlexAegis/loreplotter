import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostBinding, HostListener, Input, OnInit } from '@angular/core';
import { BaseDirective } from '@app/component/base-component.class';
import { StoreFacade } from '@lore/store/store-facade.service';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, withLatestFrom } from 'rxjs/operators';
import { Math as ThreeMath } from 'three';

@Component({
	selector: 'app-cursor',
	templateUrl: './cursor.component.html',
	styleUrls: ['./cursor.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CursorComponent extends BaseDirective implements OnInit {
	/**
	 * Still needed to protect agains out of bounds problems
	 *
	 * @param width of the parent container
	 */
	@Input()
	public containerWidth: Subject<number>;

	public frame$: Observable<{ start: number; end: number; length: number }>;
	public cursorUnix$: Observable<number>;

	public progress$: Observable<number>;

	@HostBinding('style.left.%')
	public progress;

	public panStartPosition: number;
	private shifter = new Subject<number>();

	constructor(private storeFacade: StoreFacade, private cd: ChangeDetectorRef, private el: ElementRef) {
		super();
		this.frame$ = this.storeFacade.frame$;
		this.cursorUnix$ = this.storeFacade.cursor$;
	}

	public ngOnInit() {
		this.progress$ = combineLatest([this.frame$, this.cursorUnix$]).pipe(
			map(([{ start, end }, unix]) => ThreeMath.mapLinear(unix, start, end, 0, 1))
		);

		this.teardown(
			this.progress$.subscribe(next => {
				this.progress = next * 100;
			})
		);

		this.teardown(
			this.shifter
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
				})
		);
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
}

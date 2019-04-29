import { animate, animateChild, group, query, state, style, transition, trigger } from '@angular/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import {
	AfterViewInit,
	Component,
	ElementRef,
	HostBinding,
	HostListener,
	OnDestroy,
	OnInit,
	ViewChild
} from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { Options } from 'ng5-slider';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { LoreService } from 'src/app/service/lore.service';

import { PlayComponent } from './component/play/play.component';
import { TimelineComponent } from './component/timeline/timeline.component';
import { EngineService } from './engine/engine.service';
import { ActorService } from './service/actor.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	animations: [
		trigger('leave', [
			transition(':enter', [
				style({ transform: 'translateX(-100%)', opacity: 0 }),
				animate('200ms', style({ transform: 'translateX(0)', opacity: 1 }))
			]),
			transition(':leave', [
				style({ transform: 'translateX(0)', opacity: 1 }),
				animate('200ms', style({ transform: 'translateX(-100%)', opacity: 0 }))
			])
		]),
		trigger('expand', [
			transition('open <=> closed', [group([query('@*', animateChild()), animate('500ms ease')])]),
			state(
				'open',
				style({
					height: '50vh',
					minHeight: '32em'
				})
			),
			state(
				'closed',
				style({
					height: '4rem'
				})
			)
		]),
		trigger('translateLogin', [
			transition('open <=> closed', [
				group([query(':leave', animate('500ms ease'), { optional: true }), animate('500ms ease')])
			]),
			state(
				'open',
				style({
					transform: 'translateY(0vh)'
				})
			),
			state(
				'closed',
				style({
					transform: 'translateY(40rem)'
				})
			)
		]),
		trigger('expandTitle', [
			transition('closed <=> open', [animate('500ms ease')]),
			state(
				'closed',
				style({
					maxHeight: '1rem',
					height: '1rem',
					fontSize: '7em',
					opacity: 0.2
				})
			),
			state(
				'open',
				style({
					maxHeight: '4rem',
					height: '4rem',
					fontSize: '10em',
					opacity: 0.8
				})
			)
		])
	]
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
	public constructor(
		public media: MediaObserver,
		public loreService: LoreService,
		public engineService: EngineService,
		public actorService: ActorService,
		public overlayContainer: OverlayContainer
	) {
		this.setTheme('default-theme');
		this.subscriptions.add(
			this.engineService.light$.subscribe(lum => {
				if (lum.light <= 0.5) {
					this.setTheme('dark-theme');
				} else {
					this.setTheme('light-theme');
				}
			})
		);
	}

	public title = 'Lore';

	public sliderOptions: Options = {
		floor: -6400,
		ceil: 6400
	};

	@ViewChild('container')
	private container: ElementRef;

	@ViewChild('play')
	private play: PlayComponent;

	@ViewChild('timeline')
	private timeline: TimelineComponent;

	@HostBinding('class')
	public theme = 'dark';

	public mediaLarge = true;

	private subscriptions = new Subscription();

	setTheme(theme: string) {
		this.overlayContainer.getContainerElement().classList.add(theme);
		this.theme = theme;
	}

	public ngAfterViewInit(): void {}

	public ngOnInit(): void {
		this.subscriptions.add(
			this.media
				.asObservable()
				.pipe(filter(a => a && a.length > 0))
				.subscribe((changes: MediaChange[]) => {
					this.mediaLarge = changes[0].mqAlias === 'xl';
				})
		);
	}

	@HostListener('window:keyup', ['$event'])
	public keyEvent($event: KeyboardEvent) {
		$event.preventDefault();
		switch ($event.code) {
			case 'Space':
				this.play.tap();
				this.timeline.playOrPause(this.play.play);
				break;
		}
	}

	public setSpeed($event: MouseEvent, speed: number) {
		$event.preventDefault();
		this.engineService.speed.next(speed);
	}

	public ngOnDestroy(): void {
		this.subscriptions.unsubscribe();
	}
}

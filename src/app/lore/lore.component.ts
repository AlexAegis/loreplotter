import { animate, animateChild, group, query, state, style, transition, trigger } from '@angular/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
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
import { Observable, Subscription } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { DatabaseService, LoreService } from '@app/service';
import { TimelineComponent, PlayComponent } from '@lore/component';
import { EngineService } from '@app/lore/engine';
import { faEllipsisH, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { RxDocument } from 'rxdb';
import { Lore } from '@app/model/data';
import { LoreFacade } from '@lore/store/lore.facade';

@Component({
	selector: 'app-lore',
	templateUrl: './lore.component.html',
	styleUrls: ['./lore.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
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
export class LoreComponent implements AfterViewInit, OnInit, OnDestroy {

	public currentLoreName$: Observable<string>;
	public constructor(
		public media: MediaObserver,
		public loreService: LoreService,
		public engineService: EngineService,
		private databaseService: DatabaseService,
		public overlayContainer: OverlayContainer,
		private changeDetector: ChangeDetectorRef,
		private loreFacade: LoreFacade
	) {
		this.currentLoreName$ = this.databaseService.currentLore$.pipe(map(lore => lore.name));
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

		this.loreFacade.lores$.subscribe(e => {
			console.log('Something came in the lores$ select!!!');
			console.log(e);
		});
	}

	public title = 'Lore';

	public menuIcon = faEllipsisH;

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


	private subscriptions = new Subscription();

	setTheme(theme: string) {
		this.overlayContainer.getContainerElement().classList.add(theme);
		this.theme = theme;
	}

	public ngAfterViewInit(): void {
		this.changeDetector.markForCheck();
	}

	public ngOnInit(): void {
		this.loreFacade.loadAll();
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

	@HostListener('window:contextmenu', ['$event'])
	public contextMenu($event: KeyboardEvent) {
		$event.preventDefault();
	}

	public setSpeed($event: MouseEvent, speed: number) {
		$event.preventDefault();
		// this.engineService.speed.next(speed);
	}

	public ngOnDestroy(): void {
		this.subscriptions.unsubscribe();
	}

	public createLore($event: any) {
		console.log('creating lore! Button!');
		this.loreFacade.create(new Lore('ReduxLore'));
	}

	public loadLores($event: any) {
		console.log('loading lores! Button!');
		this.loreFacade.lores$.pipe(take(1)).subscribe(e => {
			console.log('lores$ in component');
			console.log(e);
		});
	}

}

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
	OnInit,
	ViewChild
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { BaseDirective } from '@app/component/base-component.class';
import { EngineService } from '@app/lore/engine';
import { Lore } from '@app/model/data';
import { DatabaseService, LoreService } from '@app/service';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import { TimelineComponent } from '@lore/component';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Observable } from 'rxjs';

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
export class LoreComponent extends BaseDirective implements AfterViewInit, OnInit {
	@ViewChild('container')
	private container: ElementRef;
	@ViewChild('timeline')
	private timeline: TimelineComponent;
	@HostBinding('class')
	public theme = 'dark';

	public selectedLore$: Observable<Partial<Lore>>;
	public lores$: Observable<Array<Partial<Lore>>>;
	public title = 'Lore';
	public menuIcon = faEllipsisH;

	public constructor(
		public media: MediaObserver,
		public loreService: LoreService,
		public engineService: EngineService,
		private databaseService: DatabaseService,
		public overlayContainer: OverlayContainer,
		private changeDetector: ChangeDetectorRef,
		private storeFacade: StoreFacade
	) {
		super();
		this.selectedLore$ = this.storeFacade.selectedLore$;
		this.lores$ = this.storeFacade.lores$;
		this.setTheme('default-theme');
		this.teardown(
			this.engineService.light$.subscribe(lum => {
				if (lum.light <= 0.5) {
					this.setTheme('dark-theme');
				} else {
					this.setTheme('light-theme');
				}
			})
		);
	}

	public setTheme(theme: string): void {
		this.overlayContainer.getContainerElement().classList.add(theme);
		this.theme = theme;
	}

	public ngAfterViewInit(): void {
		this.changeDetector.markForCheck();
	}

	public ngOnInit(): void {}

	@HostListener('window:keyup', ['$event'])
	public keyEvent($event: KeyboardEvent) {
		$event.preventDefault();
		switch ($event.code) {
			case 'Space':
				this.storeFacade.togglePlay();
				break;
			case 'Backquote':
				// TODO: set speed
				console.log('TEST SENT');
				this.storeFacade.moveNode(10, 20, 30);
				break;
			default:
				console.log($event.code);
				break;
		}
	}

	@HostListener('window:contextmenu', ['$event'])
	public contextMenu($event: KeyboardEvent): void {
		$event.preventDefault();
	}

	public selectLore(lore: Partial<Lore>): void {
		this.storeFacade.selectLore(lore);
	}
}

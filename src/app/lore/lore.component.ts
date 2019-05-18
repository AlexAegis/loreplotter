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
import { BaseDirective } from '@app/component/base-component.class';
import { EngineService } from '@app/lore/engine';
import { DatabaseService } from '@app/service';
import { TimelineComponent } from '@lore/component';
import { StoreFacade } from '@lore/store/store-facade.service';

@Component({
	selector: 'app-lore',
	templateUrl: './lore.component.html',
	styleUrls: ['./lore.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
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

	public constructor(
		public engineService: EngineService,
		private databaseService: DatabaseService,
		public overlayContainer: OverlayContainer,
		private changeDetector: ChangeDetectorRef,
		private storeFacade: StoreFacade
	) {
		super();
	}

	public setTheme(theme: string): void {
		this.overlayContainer.getContainerElement().classList.add(theme);
		this.theme = theme;
		this.changeDetector.markForCheck();
	}

	public ngAfterViewInit(): void {
		this.setTheme('default-theme');
		this.teardown = this.engineService.light$.subscribe(light => {
			if (light <= 0.5) {
				this.setTheme('dark-theme');
			} else {
				this.setTheme('light-theme');
			}
		});
		this.changeDetector.markForCheck();
	}

	public ngOnInit(): void {}

	@HostListener('window:keydown', ['$event'])
	public onKeyDown($event: KeyboardEvent): void {
		if (document.activeElement.tagName !== 'INPUT') {
			switch ($event.code) {
				case 'Space':
					this.storeFacade.togglePlay();
					break;
				case 'Digit0':
				case 'Backquote':
					this.storeFacade.setPlaySpeed(1);
					break;
				case 'Digit1':
					this.storeFacade.setPlaySpeed(2);
					break;
				case 'Digit2':
					this.storeFacade.setPlaySpeed(4);
					break;
				case 'Digit3':
					this.storeFacade.setPlaySpeed(8);
					break;
				case 'Digit4':
					this.storeFacade.setPlaySpeed(16);
					break;
				case 'Digit5':
					this.storeFacade.setPlaySpeed(32);
					break;
				case 'Digit6':
					this.storeFacade.setPlaySpeed(64);
					break;
				case 'Digit7':
					this.storeFacade.setPlaySpeed(128);
					break;
				case 'Digit8':
					this.storeFacade.setPlaySpeed(256);
					break;
				case 'Digit9':
					this.storeFacade.setPlaySpeed(512);
					break;
				case 'ArrowDown':
				case 'NumpadSubtract':
					this.storeFacade.changePlaySpeed(-60);
					break;
				case 'ArrowUp':
				case 'NumpadAdd':
					this.storeFacade.changePlaySpeed(60);
					break;
				case 'ArrowLeft':
					this.storeFacade.changePlayDirection(-1);
					break;
				case 'ArrowRight':
					this.storeFacade.changePlayDirection(1);
					break;
				default:
					break;
			}
		}
	}

	@HostListener('window:keyup', ['$event'])
	public onKeyUp($event: KeyboardEvent): void {
		// console.log($event);
		// $event.preventDefault();
		// this.keyUpSubject.next($event.code);
	}

	@HostListener('window:contextmenu', ['$event'])
	public contextMenu($event: KeyboardEvent): void {
		$event.preventDefault();
	}
}

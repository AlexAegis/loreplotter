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
import { MatDialog } from '@angular/material';
import { BaseDirective } from '@app/component/base-component.class';
import { EngineService } from '@app/lore/engine';
import { Lore, Planet } from '@app/model/data';
import { DatabaseService, LoreService } from '@app/service';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faEllipsisH, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { TimelineComponent } from '@lore/component';
import { ExportComponent, ExportData } from '@lore/component/dialog/export.component';
import { LoreFormComponent } from '@lore/component/dialog/lore-form.component';
import { StoreFacade } from '@lore/store/store-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';

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
	public loresButSelected$: Observable<Array<Partial<Lore>>>;
	public title = 'Lore';
	public menuIcon = faEllipsisH;
	public githubIcon = faGithub;
	public plusIcon = faPlus;
	public removeIcon = faTrash;

	public constructor(
		public loreService: LoreService,
		public engineService: EngineService,
		private databaseService: DatabaseService,
		public overlayContainer: OverlayContainer,
		private changeDetector: ChangeDetectorRef,
		private storeFacade: StoreFacade,
		private dialog: MatDialog
	) {
		super();
		this.selectedLore$ = this.storeFacade.selectedLore$;
		this.lores$ = this.storeFacade.lores$;
		this.loresButSelected$ = combineLatest([this.lores$, this.selectedLore$]).pipe(
			map(([lores, selected]) => lores.filter(lore => lore.id !== selected.id))
		);
		this.setTheme('default-theme');
		this.teardown(
			this.engineService.light$.subscribe(light => {
				if (light <= 0.5) {
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
		this.changeDetector.markForCheck();
	}

	public ngAfterViewInit(): void {
		this.changeDetector.markForCheck();
	}

	public ngOnInit(): void {}

	@HostListener('window:keyup', ['$event'])
	public keyEvent($event: KeyboardEvent): void {
		$event.preventDefault();
		switch ($event.code) {
			case 'Space':
				this.storeFacade.togglePlay();
				break;
			case 'Digit0':
			case 'Backquote':
				this.storeFacade.setPlaySpeed(0);
				break;
			case 'Digit1':
				this.storeFacade.setPlaySpeed(1);
				break;
			case 'Digit2':
				this.storeFacade.setPlaySpeed(2);
				break;
			case 'Digit3':
				this.storeFacade.setPlaySpeed(4);
				break;
			case 'Digit4':
				this.storeFacade.setPlaySpeed(8);
				break;
			case 'Digit5':
				this.storeFacade.setPlaySpeed(16);
				break;
			case 'Digit6':
				this.storeFacade.setPlaySpeed(32);
				break;
			case 'Digit7':
				this.storeFacade.setPlaySpeed(64);
				break;
			case 'Digit8':
				this.storeFacade.setPlaySpeed(128);
				break;
			case 'Digit9':
				this.storeFacade.setPlaySpeed(256);
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

	@HostListener('window:contextmenu', ['$event'])
	public contextMenu($event: KeyboardEvent): void {
		$event.preventDefault();
	}

	public selectLore(lore: Partial<Lore>): void {
		this.storeFacade.selectLore(lore);
	}

	public removeLore(lore: Partial<Lore>): void {
		this.storeFacade.deleteLore(lore.id);
	}

	public createLore(): void {
		const createDialogRef = this.dialog.open(LoreFormComponent, {
			data: { planet: { name: Planet.DEFAULT_NAME, radius: Planet.DEFAULT_RADIUS } } as Lore
		});
		createDialogRef.afterClosed().subscribe((result: Lore) => this.storeFacade.createLore(result));
	}

	public editLoreCurrent(): void {
		this.selectedLore$
			.pipe(
				take(1),
				switchMap(selected => this.dialog.open(LoreFormComponent, { data: selected }).afterClosed()),
				filter(result => result !== undefined)
			)
			.subscribe(result => this.storeFacade.updateLore(result));
	}

	/**
	 * This opens up
	 * the export dialog with the dump preloaded.
	 * The textures are not included
	 */
	public exportDatabase(): void {
		this.databaseService.database$
			.pipe(
				switchMap(db => db.dump()),
				map(e => JSON.stringify(e)),
				switchMap(dump =>
					this.dialog
						.open(ExportComponent, {
							data: { data: dump } as ExportData
						})
						.afterClosed()
				)
			)
			.subscribe();
	}
	/**
	 * Opens the project's repo on a new tab
	 */
	public navigateToRepo(): void {
		window.open('https://github.com/AlexAegis/loreplotter', '_blank');
	}
}

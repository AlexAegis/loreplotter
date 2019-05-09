import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { BaseDirective } from '@app/component/base-component.class';
import { Lore, Planet } from '@app/model/data';
import { DatabaseService } from '@app/service';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faEllipsisH, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ExportComponent, ExportData } from '@lore/component/dialog/export.component';
import { LoreFormComponent } from '@lore/component/dialog/lore-form.component';
import { EngineService } from '@lore/engine';
import { StoreFacade } from '@lore/store/store-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';

@Component({
	selector: 'app-toolbar',
	templateUrl: './toolbar.component.html',
	styleUrls: ['./toolbar.component.scss'],
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
		])]
})
export class ToolbarComponent extends BaseDirective implements OnInit {

	public selectedLore$: Observable<Partial<Lore>>;
	public lores$: Observable<Array<Partial<Lore>>>;
	public loresButSelected$: Observable<Array<Partial<Lore>>>;
	public mediaLarge$: Observable<boolean>;
	public sidebarOpen$: Observable<boolean>;

	public menuIcon = faEllipsisH;
	public githubIcon = faGithub;
	public plusIcon = faPlus;
	public removeIcon = faTrash;

	public constructor(
		public engineService: EngineService,
		private databaseService: DatabaseService,
		private changeDetector: ChangeDetectorRef,
		private storeFacade: StoreFacade,
		private dialog: MatDialog
	) {
		super();
		this.selectedLore$ = this.storeFacade.selectedLore$;
		this.lores$ = this.storeFacade.lores$;
		this.mediaLarge$ = this.storeFacade.mediaLarge$;
		this.sidebarOpen$ = this.storeFacade.sidebarOpen$;
	}

	public ngOnInit(): void {
		this.loresButSelected$ = combineLatest([this.lores$, this.selectedLore$]).pipe(
			map(([lores, selected]) => lores.filter(lore => lore.id !== selected.id))
		);
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
		createDialogRef.afterClosed().subscribe((result: { tex: Blob } & Lore) => this.storeFacade.createLore(result));
	}

	public editLoreCurrent(): void {
		this.selectedLore$
			.pipe(
				take(1),
				switchMap(selected => this.dialog.open(LoreFormComponent, { data: selected }).afterClosed()),
				filter(result => result !== undefined)
			)
			.subscribe((result: { tex: Blob } & Lore) => this.storeFacade.updateLore(result));
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

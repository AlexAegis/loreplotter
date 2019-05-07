import { SkyhookDndService } from '@angular-skyhook/core';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input, OnInit } from '@angular/core';
import { BaseDirective } from '@app/component/base-component.class';
import { Actor } from '@app/model/data/actor.class';
import { ActorAccumulator, ActorService, DatabaseService } from '@app/service';
import { LoreService } from '@app/service/lore.service';
import { faMale } from '@fortawesome/free-solid-svg-icons';
import { EngineService } from '@lore/engine/engine.service';
import { RxDocument } from 'rxdb';
import { Observable } from 'rxjs';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent extends BaseDirective implements AfterViewInit, OnInit {
	public get opened(): boolean {
		return this._opened;
	}

	public set opened(opened: boolean) {
		this._opened = opened;
		this.changeDetector.markForCheck();
	}

	public constructor(
		private dnd: SkyhookDndService,
		public loreService: LoreService,
		public engineService: EngineService,
		private actorService: ActorService,
		private databaseService: DatabaseService,
		private changeDetector: ChangeDetectorRef
	) {
		super();
		this.actorDeltasAtCursor$ = this.actorService.actorDeltasAtCursor$;
		this.currentLoreActors$ = this.databaseService.currentLoreActors$;
	}

	public over = 'side';
	public maleIcon = faMale;
	public maleIconSize = 'lg';
	@Input()
	public disabled = false;

	private _opened = false;

	public actorSource = this.dnd.dragSource('Actor', {
		beginDrag: () => {
			this.opened = this.mediaLarge;
			return {};
		}
	});

	public actorDeltasAtCursor$: Observable<Array<ActorAccumulator>>;
	public currentLoreActors$: Observable<Array<RxDocument<Actor>>>;

	public mediaLarge: boolean;

	@HostListener('window:resize', ['$event'])
	public onResize($event: any): void {
		const w = $event.target.innerWidth;
		const h = $event.target.innerHeight;
		this.mediaLarge = w / h >= 1.8; // Standard 16/9 ratio is 1.77 repeating.
		if (!this.opened && this.mediaLarge) {
			this.opened = true;
		}
		this.over = this.mediaLarge ? 'side' : 'over';
		this.changeDetector.markForCheck();
	}

	public ngOnInit(): void {}

	public ngAfterViewInit(): void {
		this.onResize({ target: window });
		this.opened = this.mediaLarge;
		this.over = this.opened ? 'side' : 'over';
	}

	public select($event, actor: RxDocument<Actor>): void {
		this.engineService.selectedByActor.next(actor);
		this.opened = this.mediaLarge || false;
	}

	public onCloseStart(): void {
		this.opened = false;
	}
}

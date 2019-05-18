import { SkyhookDndService } from '@angular-skyhook/core';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input, OnInit } from '@angular/core';
import { BaseDirective } from '@app/component/base-component.class';
import { Actor } from '@app/model/data/actor.class';
import { ActorAccumulator, ActorService, DatabaseService } from '@app/service';
import { faMale } from '@fortawesome/free-solid-svg-icons';
import { EngineService } from '@lore/engine/engine.service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDocument } from 'rxdb';
import { combineLatest, Observable, Subject } from 'rxjs';
import { startWith, take, tap, withLatestFrom } from 'rxjs/operators';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent extends BaseDirective implements AfterViewInit, OnInit {
	public actorDeltasAtCursor$: Observable<Array<ActorAccumulator>>;
	public currentLoreActors$: Observable<Array<RxDocument<Actor>>>;
	public sidebarOpen$: Observable<boolean>;
	public mediaLarge$: Observable<boolean>;
	@Input()
	public disabled = false;
	private onResizeSubject = new Subject<Event>();
	private onAfterViewInitSubject = new Subject<boolean>();
	private onBeginDragSubject = new Subject<boolean>();
	public actorSource = this.dnd.dragSource('Actor', {
		beginDrag: () => {
			this.onBeginDragSubject.next(true);
			return {};
		}
	});
	private onSelectSubject = new Subject<RxDocument<Actor>>();
	public over = 'side';
	public maleIcon = faMale;
	public maleIconSize = 'lg';

	public constructor(
		private dnd: SkyhookDndService,
		public storeFacade: StoreFacade,
		public engineService: EngineService,
		private actorService: ActorService,
		private databaseService: DatabaseService,
		private changeDetector: ChangeDetectorRef
	) {
		super();
		this.actorDeltasAtCursor$ = this.actorService.actorDeltasAtCursor$;
		this.currentLoreActors$ = this.databaseService.currentLoreActors$;
		this.sidebarOpen$ = this.storeFacade.sidebarOpen$;
		this.mediaLarge$ = this.storeFacade.mediaLarge$;
	}

	@HostListener('window:resize', ['$event'])
	public onResize($event: Event): void {
		this.onResizeSubject.next($event);
	}

	public ngOnInit(): void {
		this.teardown = this.onResizeSubject.subscribe($event => {
			const w = ($event as any).target.innerWidth;
			const h = ($event as any).target.innerHeight;
			this.storeFacade.setMediaLarge(w / h >= 1.8); // Standard 16/9 ratio is 1.77 repeating.
		});
		this.teardown = combineLatest([
			this.mediaLarge$,
			this.onBeginDragSubject.pipe(startWith(undefined as boolean)),
			this.onSelectSubject.pipe(
				startWith(undefined as RxDocument<Actor>),
				tap(actor => actor && this.engineService.selectedByActor.next(actor))
			)
		]).subscribe(([mediaLarge]) => {
			this.over = mediaLarge ? 'side' : 'over';
			this.storeFacade.setSidebarOpen(mediaLarge); // When dragging, close it if its not mediaLarge
		});
		this.teardown = this.sidebarOpen$.pipe(withLatestFrom(this.mediaLarge$)).subscribe(([open, mediaLarge]) => {
			if (!mediaLarge) {
				this.storeFacade.setSidebarOpen(open);
			}
			this.changeDetector.markForCheck();
		});

		this.teardown = combineLatest([this.onAfterViewInitSubject, this.mediaLarge$, this.sidebarOpen$])
			.pipe(take(1))
			.subscribe(([afterView, mediaLarge, open]) => {
				this.onResizeSubject.next({ target: window } as any);
				this.storeFacade.setSidebarOpen(mediaLarge);
				this.over = open ? 'side' : 'over';
			});
	}

	public ngAfterViewInit(): void {
		this.onAfterViewInitSubject.next(true);
	}

	public select($event, actor: RxDocument<Actor>): void {
		this.onSelectSubject.next(actor);
	}

	public onCloseStart(): void {
		this.storeFacade.setSidebarOpen(false);
	}

	public setSidebarOpen(to: boolean): void {
		this.storeFacade.setSidebarOpen(to);
	}
}

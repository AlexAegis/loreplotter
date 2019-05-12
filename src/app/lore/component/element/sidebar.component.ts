import { SkyhookDndService } from '@angular-skyhook/core';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Input, OnInit } from '@angular/core';
import { BaseDirective } from '@app/component/base-component.class';
import { Actor } from '@app/model/data/actor.interface';
import { ActorService } from '@app/service';
import { faMale } from '@fortawesome/free-solid-svg-icons';
import { EngineService } from '@lore/engine/engine.service';
import { ActorEntity } from '@lore/store/reducers';
import { Accumulator } from '@lore/store/selectors';
import { StoreFacade } from '@lore/store/store-facade.service';
import { combineLatest, Observable, Subject } from 'rxjs';
import { take, tap } from 'rxjs/operators';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent extends BaseDirective implements AfterViewInit, OnInit {
	public actors$: Observable<Array<Partial<ActorEntity>>>;
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
	private onSelectSubject = new Subject<Partial<ActorEntity>>();
	public over = 'side';
	public maleIcon = faMale;
	public maleIconSize = 'lg';

	public constructor(
		private dnd: SkyhookDndService,
		public storeFacade: StoreFacade,
		public engineService: EngineService,
		private actorService: ActorService,
		private changeDetector: ChangeDetectorRef
	) {
		super();
		this.actors$ = this.storeFacade.actors$;
		this.sidebarOpen$ = this.storeFacade.sidebarOpen$;
		this.mediaLarge$ = this.storeFacade.mediaLarge$;
	}

	public accumulatorFor(actor: Partial<ActorEntity>): Observable<Accumulator> {
		return this.storeFacade.accumulate(actor);
	}

	@HostListener('window:resize', ['$event'])
	public onResize($event: Event): void {
		this.onResizeSubject.next($event);
	}

	public ngOnInit(): void {
		this.teardown(
			combineLatest([this.onAfterViewInitSubject, this.onResizeSubject, this.mediaLarge$, this.sidebarOpen$]).subscribe(
				([after, $event, mediaLarge, open]) => {
					const w = ($event as any).target.innerWidth;
					const h = ($event as any).target.innerHeight;
					this.storeFacade.setMediaLarge(w / h >= 1.8); // Standard 16/9 ratio is 1.77 repeating.
					if (!open && mediaLarge) {
						this.storeFacade.setSidebarOpen(true);
					}
					this.over = mediaLarge ? 'side' : 'over';
					this.changeDetector.markForCheck();
				}
			)
		);
		this.teardown(
			combineLatest([this.mediaLarge$, this.onBeginDragSubject]).subscribe(([mediaLarge, on]) => {
				this.storeFacade.setSidebarOpen(mediaLarge);
			})
		);
		this.teardown(
			combineLatest([this.mediaLarge$, this.onSelectSubject]).subscribe(([mediaLarge, actor]) => {
				this.engineService.selectedByActor.next(actor);
				this.storeFacade.setSidebarOpen(mediaLarge || false);
			})
		);
		combineLatest([this.onAfterViewInitSubject, this.mediaLarge$, this.sidebarOpen$])
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

	public select($event, actor: Partial<ActorEntity>): void {
		this.onSelectSubject.next(actor);
	}

	public onCloseStart(): void {
		this.storeFacade.setSidebarOpen(false);
	}

	public setSidebarOpen(to: boolean): void {
		this.storeFacade.setSidebarOpen(to);
	}
}

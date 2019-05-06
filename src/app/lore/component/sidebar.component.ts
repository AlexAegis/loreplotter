import { SkyhookDndService } from '@angular-skyhook/core';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { BaseDirective } from '@app/component/base-component.class';
import { EngineService } from '@app/lore/engine/engine.service';
import { Actor } from '@app/model/data/actor.class';
import { ActorAccumulator, ActorService } from '@app/service';
import { LoreService } from '@app/service/lore.service';
import { faMale } from '@fortawesome/free-solid-svg-icons';
import { RxDocument } from 'rxdb';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent extends BaseDirective implements AfterViewInit, OnInit {
	public over = 'side';
	public maleIcon = faMale;
	public maleIconSize = 'lg';
	@Input()
	public disabled = false;

	private _opened = false;

	public get opened(): boolean {
		return this._opened;
	}

	public set opened(opened: boolean) {
		this._opened = opened;
		this.changeDetector.markForCheck();
	}

	public actorSource = this.dnd.dragSource('Actor', {
		beginDrag: () => {
			this.opened = this.mediaQueryAlias === 'xl';
			return {};
		}
	});

	public actorDeltasAtCursor$: Observable<Array<ActorAccumulator>>;

	public mediaQueryAlias: string;

	public constructor(
		private media: MediaObserver,
		private dnd: SkyhookDndService,
		public loreService: LoreService,
		public engineService: EngineService,
		private actorService: ActorService,
		private changeDetector: ChangeDetectorRef
	) {
		super();
		this.actorDeltasAtCursor$ = this.actorService.actorDeltasAtCursor$;
	}

	public get mediaLarge(): boolean {
		return this.mediaQueryAlias === 'xl';
	}

	public ngOnInit(): void {}

	public ngAfterViewInit(): void {
		this.teardown(
			this.actorSource
				.listen(a => a)
				.subscribe(a => {
					// console.log(`dragging ${a.isDragging()}`);
				})
		);
		this.teardown(
			this.media
				.asObservable()
				.pipe(filter(a => a && a.length > 0))
				.subscribe((changes: MediaChange[]) => {
					this.mediaQueryAlias = changes[0].mqAlias;
					this.opened = this.mediaLarge;
					this.over = this.opened ? 'side' : 'over';
					this.changeDetector.markForCheck();
				})
		);
	}
	public select($event, actor: RxDocument<Actor>): void {
		this.engineService.selectedByActor.next(actor);
		this.opened = this.mediaLarge || false;
	}

	public onCloseStart(): void {
		this.opened = false;
	}
}

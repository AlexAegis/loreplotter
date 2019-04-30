import { SkyhookDndService } from '@angular-skyhook/core';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { faMale } from '@fortawesome/free-solid-svg-icons';
import { RxDocument } from 'rxdb';
import { filter, flatMap } from 'rxjs/operators';
import { DatabaseService } from '@app/service/database.service';
import { Actor } from '@app/model/data/actor.class';
import { LoreService } from '@app/service/lore.service';
import { EngineService } from '@app/lore/engine/engine.service';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
	over = 'side';
	expandHeight = '42px';
	collapseHeight = '42px';
	displayMode = 'flat';
	maleIcon = faMale;
	maleIconSize = 'lg';
	@Input()
	disabled = false;

	opened = false;

	actorSource = this.dnd.dragSource('Actor', {
		beginDrag: () => {
			this.opened = this.mediaQueryAlias === 'xl';
			return {};
		}
	});

	actorCount$ = this.databaseService.actorCount$;
	actors$ = this.databaseService.currentLoreActors$;

	mediaQueryAlias: string;

	constructor(
		private media: MediaObserver,
		private dnd: SkyhookDndService,
		public loreService: LoreService,
		public databaseService: DatabaseService,
		public engineService: EngineService
	) {
		this.actorSource
			.listen(a => a)
			.subscribe(a => {
				console.log(`dragging ${a.isDragging()}`);
			});
		this.media
			.asObservable()
			.pipe(filter(a => a && a.length > 0))
			.subscribe((changes: MediaChange[]) => {
				this.mediaQueryAlias = changes[0].mqAlias;
				this.opened = changes[0].mqAlias === 'xl';
				this.over = changes[0].mqAlias === 'xl' ? 'side' : 'over';
			});

	}

	ngOnInit(): void {
		this.media
		.asObservable()
		.pipe(flatMap(a => a))
		.subscribe((change: MediaChange) => {
			this.opened = change.mqAlias === 'xl';
			this.over = change.mqAlias === 'xl' ? 'side' : 'over';
		});
	}

	select($event, actor: RxDocument<Actor>): void {
		this.engineService.selectedByActor.next(actor);
	}

	ngOnDestroy() {
		this.actorSource.unsubscribe();
	}

	onCloseStart(): void {
		this.opened = false;
	}
}

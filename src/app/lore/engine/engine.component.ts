import { SkyhookDndService } from '@angular-skyhook/core';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { BaseDirective } from '@app/component/base-component.class';
import { normalizeFromWindow } from '@app/function';
import { DatabaseService, LoreService } from '@app/service';
import { EngineService } from '@lore/engine/engine.service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Subject } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';
import { Vector2 } from 'three';

@Component({
	selector: 'app-engine',
	templateUrl: './engine.component.html',
	styleUrls: ['./engine.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class EngineComponent extends BaseDirective implements AfterViewInit {
	private tapSubject = new Subject<HammerInput>();

	@ViewChild('canvas')
	public canvas: ElementRef;

	public drop = this.dnd.dropTarget('Actor', {
		drop: monitor => this.loreService.spawnActorOnClientOffset.next(monitor.getClientOffset())
	});

	public constructor(
		public engineService: EngineService,
		private storeFacade: StoreFacade,
		public db: DatabaseService,
		public loreService: LoreService,
		private dnd: SkyhookDndService
	) {
		super();
		this.teardown = this.tapSubject
			.pipe(withLatestFrom(this.storeFacade.isActorCreateMode$))
			.subscribe(([$event, isActorCreateMode]) => {
				switch (($event as any).button) {
					case undefined:
					case 0:
						this.engineService.click(
							normalizeFromWindow($event.center.x, $event.center.y),
							$event.srcEvent.shiftKey
						);

						if (isActorCreateMode) {
							this.loreService.spawnActorOnClientOffset.next({ x: $event.center.x, y: $event.center.y });
							this.storeFacade.setActorCreateMode(false);
						}
						break;
					case 2:
						this.engineService.context(normalizeFromWindow($event.center.x, $event.center.y));
						break;
				}
				this.engineService.refreshPopupPosition();
			});
	}

	public ngAfterViewInit(): void {
		this.engineService.createScene(this.canvas.nativeElement);
		this.engineService.animate();
	}

	public pan($event: any): void {
		this.engineService.pan(
			normalizeFromWindow($event.center.x, $event.center.y),
			new Vector2($event.velocityX * 2, $event.velocityY * 2),
			$event.button,
			$event.type === 'panstart',
			$event.type === 'panend'
		);
	}

	public contextmenu($event: any): boolean {
		let pos;
		if ($event.type === 'press') {
			// Hammer press event
			pos = $event.center;
		} else if ($event.type === 'contextmenu') {
			// Right click
			pos = { x: $event.clientX, y: $event.clientY };
		}
		this.engineService.context(normalizeFromWindow(pos.x, pos.y));
		return false;
	}

	public tap($event: HammerInput): void {
		($event as any).stopPropagation();
		this.tapSubject.next($event);
	}

	public hover($event: any): void {
		if (this.loreService.overrideNodePosition.value === undefined) {
			this.engineService.hover(normalizeFromWindow($event.clientX, $event.clientY));
		}
	}
}

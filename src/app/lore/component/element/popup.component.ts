import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { BaseDirective } from '@app/component/base-component.class';
import { AccumulatorField, LoreService } from '@app/service';
import { Accumulator, ActorService, FORGET_TOKEN } from '@app/service/actor.service';
import { ActorFormComponent, ActorFormResultData } from '@lore/component/dialog/actor-form.component';
import { EngineService } from '@lore/engine/engine.service';
import { Observable } from 'rxjs';
import { filter, map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { Vector2 } from 'three';
import { Property } from '@app/model/data/property.class';
import { faCaretLeft, faCaretRight, faStepBackward, faStepForward } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-popup',
	templateUrl: './popup.component.html',
	styleUrls: ['./popup.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('visibility', [
			state('hidden', style({ transform: 'scale(0)', transformOrigin: '0% 20%', opacity: '0.4' })),
			state('visible', style({ transform: 'scale(1)', transformOrigin: '0% 20%', opacity: '1' })),
			transition('hidden => visible', [animate('0.3s cubic-bezier(.56,2.05,.11,.61)')]),
			transition('visible => hidden', [animate('0.3s cubic-bezier(.11,1.07,0,1.01)')])
		])
	]
})
export class PopupComponent extends BaseDirective implements OnInit {
	@Input()
	@HostBinding('style.top.px')
	public top: number;

	@Input()
	@HostBinding('style.left.px')
	public left: number;

	public firstIcon = faStepBackward;
	public previousIcon = faCaretLeft;
	public nextIcon = faCaretRight;
	public lastIcon = faStepForward;

	public visibility = 'hidden';

	private _pos = new Vector2(0, 0);
	private resetPos = new Vector2(-10000, -10000); // yeet

	@Input()
	public set pos(vector: Vector2) {
		this.left = vector ? vector.x : this.left;
		this.top = vector ? vector.y : this.top;
		this._pos.set(this.left, this.top);
		if (vector) {
			this.visibility = 'visible';
		} else {
			this.visibility = 'hidden';
		}
	}

	public get pos(): Vector2 {
		return this._pos;
	}

	public selectedActorAccumulatorAtCursor$: Observable<Accumulator>;
	public constructor(
		private actorService: ActorService,
		private engineService: EngineService,
		private loreService: LoreService,
		private dialog: MatDialog
	) {
		super();
		this.teardown = this.engineService.selected
			.pipe(filter(a => a === undefined))
			.subscribe(next => (this.pos = this.resetPos));
		this.selectedActorAccumulatorAtCursor$ = this.actorService.selectedActorAccumulatorAtCursor$;
	}

	public edit($event): void {
		this.selectedActorAccumulatorAtCursor$
			.pipe(
				take(1),
				withLatestFrom(this.engineService.selection$),
				map(([payload, selection]) => {
					return this.dialog.open(ActorFormComponent, {
						data: payload,
						maxWidth: '48rem'
					});
				}),
				switchMap(dialog => dialog.afterClosed())
			)
			.subscribe((result: ActorFormResultData) => this.actorService.actorFormSave.next(result));
	}

	public cursorEaseTo(cursor: number): void {
		this.loreService.easeCursorToUnix.next(cursor);
	}

	public ngOnInit(): void {}

	public nonEmpty(properties: Array<AccumulatorField<Property>>) {
		return properties.filter(
			property => property.value.value !== undefined && !property.value.value.startsWith(FORGET_TOKEN)
		);
	}
}

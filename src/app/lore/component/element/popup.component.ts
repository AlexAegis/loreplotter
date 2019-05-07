import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { ActorAccumulator, ActorService } from '@app/service/actor.service';
import { ActorFormComponent, ActorFormComponentData, ActorFormResultData } from '@lore/component/dialog/actor-form.component';
import { EngineService } from '@lore/engine/engine.service';
import { Observable } from 'rxjs';
import { map, switchMap, take, withLatestFrom } from 'rxjs/operators';
import { Vector2 } from 'three';

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
export class PopupComponent implements OnInit, OnDestroy {
	@Input()
	@HostBinding('style.top.px')
	public top: number;

	@Input()
	@HostBinding('style.left.px')
	public left: number;

	public visibility = 'hidden';

	private _pos = new Vector2(0, 0);

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

	public selectedActorAccumulatorAtCursor$: Observable<ActorAccumulator>;
	public constructor(
		private actorService: ActorService,
		private engineService: EngineService,
		private dialog: MatDialog,
	) {
		this.selectedActorAccumulatorAtCursor$ = this.actorService.selectedActorAccumulatorAtCursor$;
	}

	public edit($event): void {
		this.selectedActorAccumulatorAtCursor$
			.pipe(
				take(1),
				withLatestFrom(this.engineService.selection$),
				map(([payload, selection]) => {
					return this.dialog.open(ActorFormComponent, {
						data: {
							name: payload.accumulator.name,
							maxSpeed: payload.accumulator.maxSpeed,
							knowledge: payload.accumulator.knowledge,
							selected: selection,
							cursor: payload.cursor,
							color: payload.accumulator.color
						} as ActorFormComponentData
					});
				}),
				switchMap(dialog => dialog.afterClosed())
			)
			.subscribe((result: ActorFormResultData) => this.actorService.actorFormSave.next(result));
	}

	public ngOnInit(): void {}

	public ngOnDestroy(): void {}
}

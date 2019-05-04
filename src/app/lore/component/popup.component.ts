import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material';
import { EngineService } from '@app/lore/engine/engine.service';
import { ActorService } from '@app/service/actor.service';
import { LoreService } from '@app/service/lore.service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { combineLatest, Observable } from 'rxjs';
import { map, shareReplay, switchMap, take } from 'rxjs/operators';
import { Vector2 } from 'three';
import { ActorFormComponent, ActorFormResultData } from './actor-form.component';

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

	public knowledgeOfSelected$: Observable<Array<{ key: String; value: String }>>;
	public nameOfSelected$: Observable<string>;

	public constructor(
		private actorService: ActorService,
		private engineService: EngineService,
		private loreService: LoreService,
		private formBuilder: FormBuilder,
		public dialog: MatDialog,
		private storeFacade: StoreFacade
	) {
		this.nameOfSelected$ = this.actorService.nameOfSelected$.pipe(shareReplay(1));
		this.knowledgeOfSelected$ = this.actorService.knowledgeOfSelected$.pipe(
			map(knowledgeMap => {
				const res: Array<{ key: String; value: String }> = [];
				for (const [key, value] of knowledgeMap.entries()) {
					res.push({ key, value });
				}
				return res;
			}),
			shareReplay(1)
		);
	}

	public edit($event): void {
		combineLatest([
			this.nameOfSelected$,
			this.knowledgeOfSelected$,
			this.engineService.selected,
			this.storeFacade.cursor$
		])
			.pipe(
				take(1),
				map(([name, knowledge, selected, cursor]) =>
					this.dialog.open(ActorFormComponent, { data: { name, knowledge, selected, cursor } })
				),
				switchMap(dialog => dialog.afterClosed())
			)
			.subscribe((result: ActorFormResultData) => this.loreService.saveActorDelta.next(result));
	}

	public ngOnInit(): void {}

	public ngOnDestroy(): void {}
}

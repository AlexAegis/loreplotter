import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, HostBinding, Input, OnInit, OnDestroy } from '@angular/core';
import { Vector2 } from 'three';
import { ActorService } from 'src/app/service/actor.service';
import { Subscription, Observable } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { flatMap, tap, map, filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material';
import { ActorFormComponent } from '../actor-form/actor-form.component';
@Component({
	selector: 'app-popup',
	templateUrl: './popup.component.html',
	styleUrls: ['./popup.component.scss'],
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
	top: number;

	@Input()
	@HostBinding('style.left.px')
	left: number;

	// @Input()
	// @HostBinding('style.visibility')
	visibility = 'hidden';

	private _pos = new Vector2(0, 0);

	@Input()
	set pos(vector: Vector2) {
		this.left = vector ? vector.x : this.left;
		this.top = vector ? vector.y : this.top;
		this._pos.set(this.left, this.top);
		if (vector) {
			this.visibility = 'visible';
		} else {
			this.visibility = 'hidden';
		}
	}

	get pos(): Vector2 {
		return this._pos;
	}

	public knowledgeOfSelected$: Observable<Array<{ key: String; value: String }>>;
	public nameOfSelected$: Observable<string>;
	public actorForm = this.formBuilder.group({});

	constructor(private actorService: ActorService, private formBuilder: FormBuilder, public dialog: MatDialog) {
		this.nameOfSelected$ = this.actorService.nameOfSelected$;
		this.knowledgeOfSelected$ = this.actorService.knowledgeOfSelected$.pipe(
			map(map => {
				const res: Array<{ key: String; value: String }> = [];
				for (const [key, value] of map.entries()) {
					res.push({ key, value });
				}
				return res;
			})
		);
		/*this.keysOfknowledgeOfSelected$ = this.knowledgeOfSelected$.pipe(
			tap(knowledge => {
				this.actorForm = this.formBuilder.group({});
			}),
			map(knowledge => Object.keys(knowledge)),
			tap(keys => {
				keys.forEach(key => {
					this.actorForm.addControl(key, this.formBuilder.control(''));
				});
			})
		);*/
	}

	public edit($event): void {
		const dialog = this.dialog.open(ActorFormComponent);

		dialog.afterClosed().subscribe(result => {
			console.log(`Dialog result: ${result}`);
		});
	}

	ngOnInit() {}

	ngOnDestroy(): void {}
}

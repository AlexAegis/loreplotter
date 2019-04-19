import { ActorDelta } from './../../model/actor-delta.class';
import { UnixWrapper } from './../../model/unix-wrapper.class';
import {
	Component,
	OnInit,
	Input,
	HostBinding,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Output,
	EventEmitter
} from '@angular/core';
import { Actor } from 'src/app/model/actor.class';
import { rescale } from 'src/app/misc/rescale.function';
import { LoreService } from 'src/app/service/lore.service';
import { Node } from '@alexaegis/avl';
import { DatabaseService } from 'src/app/database/database.service';
import { take } from 'rxjs/operators';

@Component({
	selector: 'app-block',
	templateUrl: './block.component.html',
	styleUrls: ['./block.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlockComponent implements OnInit {
	@Input()
	public set containerWidth(containerWidth: number) {
		this._containerWidth = containerWidth;
		this.update();
	}

	public get containerWidth(): number {
		return this._containerWidth;
	}

	private _actors: Array<Actor>;

	@Input()
	public set actors(actors: Array<Actor>) {
		this._actors = actors;
		this.update();
	}

	public get actors(): Array<Actor> {
		return this._actors;
	}

	@Input()
	public set actor(actor: Actor) {
		this._actor = actor;
		this.blockStart = this._actor.states.first().key.unix;
		this.blockEnd = this._actor.states.last().key.unix;
		this.update();
	}

	public get actor(): Actor {
		return this._actor;
	}

	@Input()
	public set frameStart(frameStart: number) {
		this._frameStart = frameStart;
		this.update();
	}

	public get frameStart(): number {
		return this._frameStart;
	}

	@Input()
	public set frameEnd(frameEnd: number) {
		this._frameEnd = frameEnd;
		this.update();
	}

	public get frameEnd(): number {
		return this._frameEnd;
	}

	constructor(
		public databaseService: DatabaseService,
		public loreService: LoreService,
		private cd: ChangeDetectorRef
	) {}

	@Output()
	public jump = new EventEmitter<number>();

	public _containerWidth: number;

	private _actor: Actor;
	private blockStart: number;
	private blockEnd: number;

	public _frameStart: number;

	public _frameEnd: number;

	@HostBinding('style.left.px')
	public left: number;

	@HostBinding('style.width.px')
	public width: number;

	private _originalUnixForPan: number;

	private update(): void {
		if (
			this.blockStart !== undefined &&
			this.blockEnd !== undefined &&
			this.frameStart !== undefined &&
			this.frameEnd !== undefined &&
			this.containerWidth !== undefined
		) {
			this.left = rescale(this.blockStart, this.frameStart, this.frameEnd, 0, this.containerWidth);
			const right = rescale(this.blockEnd, this.frameStart, this.frameEnd, 0, this.containerWidth);
			this.width = right - this.left;
		}
		this.cd.detectChanges();
	}

	public nodePosition(unix: number): number {
		return rescale(unix, this.blockStart, this.blockEnd, 0, this.width);
	}

	public panstart($event: any): void {}

	/**
	 * This method is for moving the nodes in a block to change the time of an event.
	 * To avoid unnecessary writes and reads from the database, during the pan, this is only an override
	 * and the actual writing happens only when the pan ends to the final position.
	 */
	public pan($event: any, node: Node<UnixWrapper, ActorDelta>): void {
		if ($event.type === 'panstart') {
			this._originalUnixForPan = node.key.unix;
		} else {
			const previous = node.key.unix;
			const val = node.value;
			// console.log(val);
			const pos = this.nodePosition(this._originalUnixForPan) + this.left;
			const rescaledUnix = rescale(pos + $event.deltaX, 0, this.containerWidth, this.frameStart, this.frameEnd);
			// const result = this._actor.states.moveNode(node.key, new UnixWrapper(rescaledUnix));
			this.loreService.overrideNodePosition$.next({ old: previous, new: rescaledUnix }); // {
			// const result = this._actor.states.remove(node.key);
			// node.key.unix = rescaledUnix;
			// this._actor.states.set(new UnixWrapper(rescaledUnix), node.value);
		}
		this.update();
		if ($event.type === 'panend') {
			this.loreService.overrideNodePosition$.next(undefined); // Clear the Subject
			// this._originalKeyForPan = undefined;
			// TODO: persist
			/*
			this.databaseService.currentLore.pipe(take(1)).subscribe(lore => {
				console.log('subbed');
				lore.atomicUpdate(l => {
					console.log('atomu');
					l.actors
						// .filter(actor => actor.id === this._actor.id)
						.map(this.databaseService.actorStateMapper)
						.forEach(actor => {
							actor.states.remove(previous);

							const pos = this.nodePosition(this._originalUnixForPan) + this.left;
							const rescaledUnix = rescale(
								pos + $event.deltaX,
								0,
								this.containerWidth,
								this.frameStart,
								this.frameEnd
							);
							console.log('happened');
							actor.states.set(new UnixWrapper(rescaledUnix), val);
						});
					return l;
				});
			});*/
		}
	}

	ngOnInit() {}
}

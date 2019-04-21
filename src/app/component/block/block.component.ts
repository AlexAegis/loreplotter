import { Node } from '@alexaegis/avl';
import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostBinding,
	HostListener,
	Input,
	OnInit,
	Output
} from '@angular/core';
import { take } from 'rxjs/operators';
import { DatabaseService } from 'src/app/database/database.service';
import { rescale } from 'src/app/misc/rescale.function';
import { Actor } from 'src/app/model/actor.class';
import { OverridableProperty } from 'src/app/model/overridable-property.class';
import { LoreService } from 'src/app/service/lore.service';

import { ActorDelta } from './../../model/actor-delta.class';
import { UnixWrapper } from './../../model/unix-wrapper.class';

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
		this.blockStart.original = this._actor.states.first().key.unix;
		this.blockEnd.original = this._actor.states.last().key.unix;
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

	private _actors: Array<Actor>;

	@Output()
	public jump = new EventEmitter<number>();

	public _containerWidth: number;

	private _actor: Actor;
	private blockStart = new OverridableProperty<number>(undefined); // in unix
	private blockEnd = new OverridableProperty<number>(undefined); // in unix

	public _frameStart: number;

	public _frameEnd: number;

	@HostBinding('style.left.px')
	public left: number;

	@HostBinding('style.width.px')
	public width: number;

	// Used when moving the node in the database as the overrides 'previous' field is getting constantly updated
	private _originalUnixesForPan: Map<Node<UnixWrapper, ActorDelta>, number> = new Map();
	// These field will hold the values for the boundaries of the block override while moving the last or the first node
	// So the block will never be smaller then it should
	private _afterFirstUnix: number;
	private _beforeLastUnix: number;

	private update(): void {
		if (
			this.blockStart !== undefined &&
			this.blockEnd !== undefined &&
			this.frameStart !== undefined &&
			this.frameEnd !== undefined &&
			this.containerWidth !== undefined
		) {
			this.left = rescale(this.blockStart.value, this.frameStart, this.frameEnd, 0, this.containerWidth);
			const right = rescale(this.blockEnd.value, this.frameStart, this.frameEnd, 0, this.containerWidth);
			this.width = right - this.left;
		}
		this.cd.detectChanges();
	}

	public nodePosition(unix: number): number {
		return rescale(unix, this.blockStart.value, this.blockEnd.value, 0, this.width);
	}

	/**
	 * This method is for moving the nodes in a block to change the time of an event.
	 * To avoid unnecessary writes and reads from the database, during the pan, this is only an override
	 * and the actual writing happens only when the pan ends to the final position.
	 */
	public panNode($event: any, node: Node<UnixWrapper, ActorDelta>): void {
		$event.stopPropagation();
		if ($event.type === 'panstart') {
			this._originalUnixesForPan.set(node, node.key.unix);

			const nodeIterator = this._actor.states.nodes();
			const first = nodeIterator.next();
			const second = nodeIterator.next();
			if (second) {
				this._afterFirstUnix = second.value.key.unix;
			} else {
				this._afterFirstUnix = first.value.key.unix;
			}

			const reverseNodeIterator = this._actor.states.reverseNodes();
			const last = reverseNodeIterator.next();
			const secondLast = reverseNodeIterator.next();
			if (secondLast) {
				this._beforeLastUnix = secondLast.value.key.unix;
			} else {
				this._beforeLastUnix = last.value.key.unix;
			}
		}
		const ogUnix = this._originalUnixesForPan.get(node);
		const previous = node.key.unix;
		const pos = this.nodePosition(ogUnix) + this.left;
		const rescaledUnix = rescale(pos + $event.deltaX, 0, this.containerWidth, this.frameStart, this.frameEnd);

		let firstLimit: number;

		if (ogUnix === this.blockStart.original) {
			firstLimit = this._afterFirstUnix;
		} else {
			firstLimit = this.blockStart.original;
		}

		let lastLimit: number;

		if (ogUnix === this.blockEnd.original) {
			lastLimit = this._beforeLastUnix;
		} else {
			lastLimit = this.blockEnd.original;
		}

		if (rescaledUnix <= firstLimit) {
			this.blockStart.override = rescaledUnix;
		} else {
			this.blockStart.override = firstLimit;
		}

		if (rescaledUnix >= lastLimit) {
			this.blockEnd.override = rescaledUnix;
		} else {
			this.blockEnd.override = lastLimit;
		}

		// Edge case. Also, the block has to be at least 1 px wide
		if (this._actor.states.length === 1) {
			this.blockStart.override = rescaledUnix;
			this.blockEnd.override = rescaledUnix + 1;
		}

		if (previous !== NaN && rescaledUnix !== NaN) {
			node.key.unix = rescaledUnix;
			this.loreService.overrideNodePosition$.next({
				actorId: this._actor.id,
				overrides: [{ original: ogUnix, previous: previous, new: node.key.unix }]
			});
		}
		this.update();

		if ($event.type === 'panend') {
			this.finalizeNewPositions();
		}
	}

	@HostListener('panstart', ['$event'])
	@HostListener('panleft', ['$event'])
	@HostListener('panright', ['$event'])
	@HostListener('panup', ['$event'])
	@HostListener('pandown', ['$event'])
	@HostListener('panend', ['$event'])
	public pan($event: any) {
		$event.stopPropagation();
		if ($event.type === 'panstart') {
			for (const node of this.actor.states.nodes()) {
				this._originalUnixesForPan.set(node, node.key.unix);
			}
		}

		const ogFirstUnix = this._originalUnixesForPan.get(this.actor.states.nodes().next().value);
		const pos = this.nodePosition(ogFirstUnix) + this.left;
		const rescaledUnix = rescale(pos + $event.deltaX, 0, this.containerWidth, this.frameStart, this.frameEnd);

		const diff = rescaledUnix - ogFirstUnix;
		const overrides = [];
		for (const node of this.actor.states.nodes()) {
			const previous = node.key.unix;
			const ogUnix = this._originalUnixesForPan.get(node);
			node.key.unix = ogUnix + diff;
			overrides.push({
				original: ogUnix,
				previous: previous,
				new: node.key.unix
			});
		}

		this.blockStart.override = this.actor.states.nodes().next().value.key.unix;
		this.blockEnd.override = this.actor.states.reverseNodes().next().value.key.unix;
		this.update();
		this.loreService.overrideNodePosition$.next({
			actorId: this._actor.id,
			overrides: overrides
		});

		if ($event.type === 'panend') {
			this.finalizeNewPositions();
		}
	}

	private finalizeNewPositions() {
		this.databaseService.currentLore.pipe(take(1)).subscribe(lore => {
			lore.atomicUpdate(l => {
				l.actors
					.filter(actor => actor.id === this._actor.id)
					.map(this.databaseService.actorStateMapper)
					.forEach(actor => {
						this.loreService.overrideNodePosition$.value.overrides.forEach(ov => {
							const val = actor.states.remove(new UnixWrapper(ov.original));
							actor.states.set(new UnixWrapper(ov.new), val);
						});
					});
				return l;
			}).finally(() => {
				this.loreService.overrideNodePosition$.next(undefined);
				this._originalUnixesForPan.clear();
				this.update();
			});
		});
	}

	ngOnInit() {}
}

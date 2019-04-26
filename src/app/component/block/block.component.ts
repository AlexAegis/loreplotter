import { BlockService } from './block.service';
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
	Output,
	OnDestroy,
	OnChanges,
	SimpleChanges
} from '@angular/core';
import { take, filter, flatMap, switchMap, tap, map, finalize, withLatestFrom } from 'rxjs/operators';
import { DatabaseService } from 'src/app/database/database.service';
import { Actor } from 'src/app/model/actor.class';
import { OverridableProperty } from 'src/app/model/overridable-property.class';
import { LoreService } from 'src/app/service/lore.service';

import { ActorDelta } from './../../model/actor-delta.class';
import { UnixWrapper } from './../../model/unix-wrapper.class';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import * as THREE from 'three';
import RxDB, { RxDocument } from 'rxdb';

@Component({
	selector: 'app-block',
	templateUrl: './block.component.html',
	styleUrls: ['./block.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlockComponent implements OnInit, OnChanges, OnDestroy {
	@HostBinding('style.opacity')
	public get isSavingOpacity(): number {
		return this.isSaving ? 0.5 : 1;
	}
	/**
	 * Pointer events are disabled while saving
	 */
	@HostBinding('style.pointer-events')
	public get isSavingPointerEvents(): string {
		return this.isSaving ? 'none' : 'all';
	}

	@Input()
	public set containerWidth(containerWidth: number) {
		this._containerWidth = containerWidth;
		this.update();
	}

	public get containerWidth(): number {
		return this._containerWidth;
	}

	@Input()
	public set actors(actors: Array<RxDocument<Actor>>) {
		this._actors = actors;
		this.update();
	}

	public get actors(): Array<RxDocument<Actor>> {
		return this._actors;
	}

	@Input()
	public set actor(actor: RxDocument<Actor>) {
		this._actor = actor;
		this.blockStart.original = this._actor.states.first().key.unix;
		this.blockEnd.original = this._actor.states.last().key.unix;
		this.update();
	}

	public get actor(): RxDocument<Actor> {
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
		public blockService: BlockService,
		public cd: ChangeDetectorRef
	) {}

	public get isAtMostOneLeft(): boolean {
		return this.actor.states.length <= 1;
	}

	public isDestroyed = false;
	public faTrash = faTrash; // Node remove icon
	public isPanning = false;
	public isSaving = false;
	public selection: Node<UnixWrapper, ActorDelta>;

	private _actors: Array<RxDocument<Actor>>;

	@Output()
	public jump = new EventEmitter<number>();

	public _containerWidth: number;

	private _actor: RxDocument<Actor>;
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

	ngOnChanges(changes: SimpleChanges): void {}

	/**
	 * I'm marking the object as destroyed so the tear-down mechanic in the block-service would skip it's operation
	 */
	ngOnDestroy(): void {
		console.log('block destorye');
		this.isDestroyed = true;
	}

	private update(): void {
		if (
			this.blockStart !== undefined &&
			this.blockEnd !== undefined &&
			this.frameStart !== undefined &&
			this.frameEnd !== undefined &&
			this.containerWidth !== undefined
		) {
			this.left = THREE.Math.mapLinear(
				this.blockStart.value,
				this.frameStart,
				this.frameEnd,
				0,
				this.containerWidth
			);
			const right = THREE.Math.mapLinear(
				this.blockEnd.value,
				this.frameStart,
				this.frameEnd,
				0,
				this.containerWidth
			);
			this.width = right - this.left;
		}
		this.cd.markForCheck();
		this.cd.detectChanges();
	}

	public nodePosition(unix: number): number {
		/*console.log(
			`nodePosition: { unix: ${unix}, blockStart: ${this.blockStart.value}, blockEnd: ${
				this.blockEnd.value
			}, width: ${this.width} }`
		);*/

		const finalUnix = unix;
		/*if (this.loreService.overrideNodePosition$.value) {
			this.loreService.overrideNodePosition$.value.overrides.forEach(override => {
				if (override.original === unix) {
					finalUnix = override.new;
				}
			});
		}*/

		return this.width > 0 // If the width is 0, eg.: there's only one node, there's no point in mapping anything, it would produce a NaN
			? THREE.Math.mapLinear(finalUnix, this.blockStart.value, this.blockEnd.value, 0, this.width)
			: 0;
	}

	/**
	 * This method is for moving the nodes in a block to change the time of an event.
	 * To avoid unnecessary writes and reads from the database, during the pan, this is only an override
	 * and the actual writing happens only when the pan ends to the final position.
	 */
	public panNode($event: any, node: Node<UnixWrapper, ActorDelta>): void {
		$event.stopPropagation();
		if ($event.type === 'panstart') {
			this.isPanning = true;
			this._originalUnixesForPan.set(node, node.key.unix);
			for (const n of this.actor.states.nodes()) {
				console.log(`quickly iterating through nodes: ${n.key.unix}`);
			}
			const nodeIterator = this.actor.states.nodes();
			const first = nodeIterator.next();
			this.blockStart.original = first.value.key.unix; // ? LOOK OVER HERE
			console.log(`first node:`);
			const second = nodeIterator.next();
			if (second.value) {
				this._afterFirstUnix = second.value.key.unix;
			} else {
				this._afterFirstUnix = first.value.key.unix;
			}

			const reverseNodeIterator = this.actor.states.reverseNodes();
			const last = reverseNodeIterator.next();
			this.blockEnd.original = last.value.key.unix; // ? LOOK OVER HERE
			const secondLast = reverseNodeIterator.next();
			if (secondLast.value) {
				this._beforeLastUnix = secondLast.value.key.unix;
			} else {
				this._beforeLastUnix = last.value.key.unix;
			}
		}
		const ogUnix = this._originalUnixesForPan.get(node);
		const previous = node.key.unix;
		const pos = this.nodePosition(ogUnix) + this.left;
		const rescaledUnix = THREE.Math.mapLinear(
			pos + $event.deltaX,
			0,
			this.containerWidth,
			this.frameStart,
			this.frameEnd
		);

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

		console.log(`rescaledUnix: ${rescaledUnix} firstLimit: ${firstLimit}`);
		if (rescaledUnix <= firstLimit) {
			this.blockStart.override = rescaledUnix;
			console.log(`using rescaledUnix! ${rescaledUnix}`);
		} else {
			this.blockStart.override = firstLimit;
			console.log(`using firstLimit! ${firstLimit}`);
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
		console.log(node.key.unix);
		if (previous !== NaN && rescaledUnix !== NaN) {
			node.key.unix = rescaledUnix; // ! HEY
			this.loreService.overrideNodePosition$.next({
				actorId: this.actor.id,
				overrides: [{ original: ogUnix, previous: previous, new: rescaledUnix }]
			});
		}
		this.update();

		if ($event.type === 'panend') {
			this.isPanning = false;
			this.finalizeNewPositions();
			this.update();
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
			this.isPanning = true;
			for (const node of this.actor.states.nodes()) {
				this._originalUnixesForPan.set(node, node.key.unix);
			}
		}

		const ogFirstUnix = this._originalUnixesForPan.get(this.actor.states.nodes().next().value);
		const pos = this.nodePosition(ogFirstUnix) + this.left;
		const rescaledUnix = THREE.Math.mapLinear(
			pos + $event.deltaX,
			0,
			this.containerWidth,
			this.frameStart,
			this.frameEnd
		);

		const diff = rescaledUnix - ogFirstUnix;
		const overrides = [];
		for (const node of this.actor.states.nodes()) {
			const previous = node.key.unix;
			const ogUnix = this._originalUnixesForPan.get(node);
			node.key.unix = ogUnix + diff; // ! HEY
			overrides.push({
				original: ogUnix,
				previous: previous,
				new: ogUnix + diff
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
			this.isPanning = false;
			this.finalizeNewPositions().then();
		}
	}

	private async finalizeNewPositions() {
		this.isSaving = true;
		this.actor = await this.actor.atomicUpdate(a => {
			this.loreService.overrideNodePosition$.value.overrides.forEach(override => {
				a = this.databaseService.actorStateMapper(a as RxDocument<Actor>);
				const delta = a.states.remove(new UnixWrapper(override.original)); // TODO Replace this with moveNode once it's fixed
				if (delta) {
					a.states.set(new UnixWrapper(override.new), delta);
				}
			});
			return a;
		});
		this.loreService.overrideNodePosition$.next(undefined);
		this._originalUnixesForPan.clear();
		this.isSaving = false;
		this.update();
	}

	public tap($event: any, node: Node<UnixWrapper, ActorDelta>) {
		$event.stopPropagation();
		this.blockService.selection.next({ block: this, node: node });
	}

	public select(node: Node<UnixWrapper, ActorDelta>) {
		this.selection = node;
		this.jump.next(this.nodePosition(node.key.unix) + this.left);
		this.cd.detectChanges();
	}

	public deselect(): void {
		this.selection = undefined;
		this.cd.detectChanges();
	}

	public remove($event: any, node: Node<UnixWrapper, ActorDelta>) {
		$event.stopPropagation();
		if (!this.isAtMostOneLeft) {
			//  TODO: Make hammer not ignore the disabled setting on buttons
			this.blockService.selection.next(undefined);
			this.isSaving = true;
			this.actor.states.remove(node.key);
			this.cd.detectChanges();
			this.actor
				.atomicUpdate(a => (a.states = this.actor.states) && a)
				.then()
				.finally(() => {
					this.isSaving = false;
					this.update();
				});
		}
	}

	ngOnInit() {}
}

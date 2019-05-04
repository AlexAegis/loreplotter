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
import { DatabaseService, LoreService } from '@app/service';
import { BlockService } from '@lore/service';
import { Actor } from '@app/model/data';
import { OverridableProperty } from '@app/model/overridable-property.class';

import { ActorDelta, UnixWrapper } from '@app/model/data';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { Math as ThreeMath } from 'three';
import { RxDocument } from 'rxdb';
import { StoreFacade } from '@lore/store/store-facade.service';
import { combineLatest, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

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
	public set actors(actors: Array<RxDocument<Actor>>) {
		this._actors = actors;
		// this.update();
	}

	public get actors(): Array<RxDocument<Actor>> {
		return this._actors;
	}

	@Input()
	public set actor(actor: RxDocument<Actor>) {
		this._actor = actor;
		this._actor._userdata = { block: this };
		this.blockStart.original = this.blockStart.override = this._actor._states.first().key.unix;
		this.blockEnd.original = this.blockEnd.override = this._actor._states.last().key.unix;
		// this.update();
	}

	public get actor(): RxDocument<Actor> {
		return this._actor;
	}

	constructor(
		public databaseService: DatabaseService,
		public loreService: LoreService,
		public blockService: BlockService,
		private storeFacade: StoreFacade,
		public cd: ChangeDetectorRef
	) {
		this.frame$ = this.storeFacade.frame$;
		// this.update(); on next
		// TODO Refactor
		/*this.frame$.subscribe(frame => {
			this.frameStart = frame.start;
			this.frameEnd = frame.end;
			this.update();
		});*/
	}

	public get isAtMostOneLeft(): boolean {
		return this.actor._states.length <= 1;
	}

	@Input()
	public containerWidth: Observable<number>;


	public frame$: Observable<{start: number, end: number, length: number}>;

	public isDestroyed = false;
	public faTrash = faTrash; // Node remove icon
	public isPanning = false;
	public isSaving = false;
	public selection: Node<UnixWrapper, ActorDelta>;

	private _actors: Array<RxDocument<Actor>>;

	@Output()
	public jump = new EventEmitter<number>();

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

	public updateSubscriber = combineLatest([this.frame$, this.containerWidth]).pipe(
		map(([frame, containerWidth]) => {
			if (
				this.blockStart !== undefined &&
				this.blockEnd !== undefined
			) {
				this.left = ThreeMath.mapLinear(
					this.blockStart.override || this.blockStart.original,
					frame.start,
					frame.end,
					0,
					containerWidth
				);
				const right = ThreeMath.mapLinear(
					this.blockEnd.override || this.blockEnd.original,
					frame.start,
					frame.end,
					0,
					containerWidth
				);
				this.width = right - this.left;
			}
			this.cd.markForCheck();
			this.cd.detectChanges();
		})
	).subscribe();

	public removeSubject = new Subject<{$event: MouseEvent, node: Node<UnixWrapper, ActorDelta>}>();
	private removeSubjectSubscription = this.removeSubject.pipe();

	public clearBlockOverrides() {
		this.blockStart.original = undefined;
		this.blockEnd.original = undefined;
	}

	ngOnChanges(changes: SimpleChanges): void {}

	/**
	 * I'm marking the object as destroyed so the tear-down mechanic in the block-service would skip it's operation
	 */
	ngOnDestroy(): void {
		this.isDestroyed = true;
	}



	public nodePosition(unix: number): number {
		return this.width > 0 // If the width is 0, eg.: there's only one node, there's no point in mapping anything, it would produce a NaN
			? ThreeMath.mapLinear(
					unix,
					this.blockStart.override || this.blockStart.original,
					this.blockEnd.override || this.blockEnd.original,
					0,
					this.width
			  )
			: 0;
	}

	/**
	 * This method is for moving the nodes in a block end change the time of an event.
	 * To avoid unnecessary writes and reads start the database, during the pan, this is only an override
	 * and the actual writing happens only when the pan ends end the final position.
	 */
	public panNode($event: any, node: Node<UnixWrapper, ActorDelta>): void {
		$event.stopPropagation();
		/*if ($event.type === 'panstart') {
			this.isPanning = true;
			this._originalUnixesForPan.set(node, node.key.unix);
			const nodeIterator = this.actor._states.nodes();
			const first = nodeIterator.next();
			this.blockStart.original = first.value.key.unix;
			const second = nodeIterator.next();
			if (second.value) {
				this._afterFirstUnix = second.value.key.unix;
			} else {
				this._afterFirstUnix = first.value.key.unix;
			}

			const reverseNodeIterator = this.actor._states.reverseNodes();
			const last = reverseNodeIterator.next();
			this.blockEnd.original = last.value.key.unix;
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
		const rescaledUnix = ThreeMath.mapLinear(
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

		// Edge case. Also, the block has end be at least 1 px wide
		if (this._actor._states.length === 1) {
			this.blockStart.override = rescaledUnix;
			this.blockEnd.override = rescaledUnix + 1;
		}
		if (!isNaN(previous) && !isNaN(rescaledUnix)) {
			// node.key.unix = rescaledUnix; // ! HEY You can probably remove this
			this.loreService.overrideNodePosition.next({
				actorId: this.actor.id,
				overrides: [{ original: ogUnix, previous: previous, new: rescaledUnix }]
			});
		}
		this.update();

		if ($event.type === 'panend') {
			this.isPanning = false;
			this.finalizeNewPositions();
			this.update();
		}*/
	}

	@HostListener('panstart', ['$event'])
	@HostListener('panleft', ['$event'])
	@HostListener('panright', ['$event'])
	@HostListener('panup', ['$event'])
	@HostListener('pandown', ['$event'])
	@HostListener('panend', ['$event'])
	public pan($event: any) {
		$event.stopPropagation();
		/*if ($event.type === 'panstart') {
			this.isPanning = true;
			for (const node of this.actor._states.nodes()) {
				this._originalUnixesForPan.set(node, node.key.unix);
			}
		}

		const ogFirstUnix = this._originalUnixesForPan.get(this.actor._states.nodes().next().value);
		const pos = this.nodePosition(ogFirstUnix) + this.left;
		const rescaledUnix = ThreeMath.mapLinear(
			pos + $event.deltaX,
			0,
			this.containerWidth,
			this.frameStart,
			this.frameEnd
		);

		const diff = rescaledUnix - ogFirstUnix;
		const overrides = [];
		for (const node of this.actor._states.nodes()) {
			const previous = node.key.unix;
			const ogUnix = this._originalUnixesForPan.get(node);
			// node.key.unix = ogUnix + diff; // ! HEY You can probably remove this
			overrides.push({
				original: ogUnix,
				previous: previous,
				new: ogUnix + diff
			});
		}

		this.blockStart.override = this.actor._states.nodes().next().value.key.unix;
		this.blockEnd.override = this.actor._states.reverseNodes().next().value.key.unix;
		this.update();
		this.loreService.overrideNodePosition.next({
			actorId: this._actor.id,
			overrides: overrides
		});

		if ($event.type === 'panend') {
			this.isPanning = false;
			this.finalizeNewPositions();
		}*/
	}

	private finalizeNewPositions() {
		this.isSaving = true;
		this.actor
			.atomicUpdate(a => {
				this.resetEveryNodeToOriginalUnix();
				this.loreService.overrideNodePosition.value.overrides.forEach(override => {
					const delta = this.actor._states.remove(new UnixWrapper(override.original)); // TODO Replace this with moveNode once it's fixed
					if (delta) {
						this.actor._states.set(new UnixWrapper(override.new), delta);
					}
				});
				a._states = this.actor._states;
				return a;
			})
			.then(actor => {
				this.loreService.overrideNodePosition.next(undefined);
				this._originalUnixesForPan.clear();
				this.isSaving = false;
				this.actor = actor;
			});
	}

	public resetEveryNodeToOriginalUnix(): void {
		for (const [key, val] of this._originalUnixesForPan.entries()) {
			key.key.unix = val;
		}
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
			this.actor._states.remove(node.key);
			this.cd.detectChanges();
			this.actor
				.atomicUpdate(a => (a._states = this.actor._states) && a)
				.then(() => {
					this.isSaving = false;
					// this.update();
				});
		}
	}

	ngOnInit() {}
}

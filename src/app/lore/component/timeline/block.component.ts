import { Enclosing, Node } from '@alexaegis/avl';
import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostBinding,
	HostListener,
	Input,
	OnDestroy,
	OnInit,
	Output
} from '@angular/core';
import { MatDialog } from '@angular/material';
import { BaseDirective } from '@app/component/base-component.class';
import { Actor, ActorDelta, UnixWrapper } from '@app/model/data';
import { OverridableProperty } from '@app/model/overridable-property.class';
import { LoreService } from '@app/service';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { ConfirmComponent } from '@lore/component/dialog/confirm.component';
import { EngineService } from '@lore/engine';
import { BlockService } from '@lore/service';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDocument } from 'rxdb';
import { Observable } from 'rxjs';
import { Math as ThreeMath, Vector3 } from 'three';

@Component({
	selector: 'app-block',
	templateUrl: './block.component.html',
	styleUrls: ['./block.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlockComponent extends BaseDirective implements OnInit, OnDestroy, AfterViewInit {

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
	public set actor(actor: RxDocument<Actor>) {
		this._actor = actor;
		this._actor._userdata = { block: this };
		this.blockStart.original = this.blockStart.override = this._actor._states.first().key.unix;
		this.blockEnd.original = this.blockEnd.override = this._actor._states.last().key.unix;
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

	public get isAtMostOneLeft(): boolean {
		return this.actor._states.length <= 1;
	}

	constructor(
		public loreService: LoreService,
		private engineService: EngineService,
		public blockService: BlockService,
		private storeFacade: StoreFacade,
		public cd: ChangeDetectorRef,
		private dialog: MatDialog
	) {
		super();
	}
	private _w = new UnixWrapper(0);

	public invalidNodeForPan: Node<UnixWrapper, ActorDelta>;
	public closestCorrectUnixToTarget: number;

	@Input()
	public containerWidthListener: Observable<number>;

	public isDestroyed = false;
	public faTrash = faTrash; // Node remove icon
	public isPanning = false;
	public isSaving = false;
	public selection: Node<UnixWrapper, ActorDelta>;

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

	private _couldRemoveForPan: boolean;
	private _couldRemoveForPanEnclosing: {
		prev: Node<UnixWrapper, ActorDelta>;
		next: Node<UnixWrapper, ActorDelta>;
		speed: number;
	};

	public update(): void {
		if (
			this.blockStart !== undefined &&
			this.blockEnd !== undefined &&
			this.frameStart !== undefined &&
			this.frameEnd !== undefined &&
			this.containerWidth !== undefined
		) {
			this.left = ThreeMath.mapLinear(
				this.blockStart.value,
				this.frameStart,
				this.frameEnd,
				0,
				this.containerWidth
			);
			const right = ThreeMath.mapLinear(
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
		return this.width > 0 // If the width is 0, eg.: there's only one node, there's no point in mapping anything, it would produce a NaN
			? ThreeMath.mapLinear(unix, this.blockStart.value, this.blockEnd.value, 0, this.width)
			: 0;
	}

	public surroundAndSpeed(
		node: Node<UnixWrapper, ActorDelta>
	): { prev: Node<UnixWrapper, ActorDelta>; next: Node<UnixWrapper, ActorDelta>; speed: number } {
		let prevNodeNow: Node<UnixWrapper, ActorDelta>;
		let nextNodeNow: Node<UnixWrapper, ActorDelta>;
		let speedFromPrevious = Actor.DEFAULT_MAX_SPEED;

		for (const n of this.actor._states.nodes()) {
			if (n.key.unix > node.key.unix) {
				nextNodeNow = n;
				break;
			}
			if (n.key.unix < node.key.unix) {
				prevNodeNow = n;
				if (n.value.maxSpeed !== undefined) {
					speedFromPrevious = n.value.maxSpeed;
				}
			}
		}
		return { prev: prevNodeNow, next: nextNodeNow, speed: speedFromPrevious };
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

			this._couldRemoveForPan = this.canRemove(node);
			this._couldRemoveForPanEnclosing = this.surroundAndSpeed(node);
		}

		const ogUnix = this._originalUnixesForPan.get(node);
		const previous = node.key.unix;
		const pos = this.nodePosition(ogUnix) + this.left;
		const rescaledUnix = Math.floor(
			ThreeMath.mapLinear(pos + $event.deltaX, 0, this.containerWidth, this.frameStart, this.frameEnd)
		);

		// VALIDATION START
		const { prev, next, speed } = this.surroundAndSpeed(node);
		// If the dragged node modifies the speed, use that
		const speedToNext = node.value.maxSpeed !== undefined ? node.value.maxSpeed : speed;

		let closestCorrectUnixToReachPrevious = rescaledUnix;
		if (prev) {
			const correctedTime = this.engineService.canReach(
				prev.value.position,
				node.value.position,
				speed,
				Math.abs(node.key.unix - prev.key.unix)
			);
			if (correctedTime !== undefined) {
				closestCorrectUnixToReachPrevious = prev.key.unix + correctedTime;
			}
		}

		let closestCorrectUnixToReachNext = rescaledUnix;
		if (next) {
			const correctedTime = this.engineService.canReach(
				node.value.position,
				next.value.position,
				speedToNext,
				Math.abs(node.key.unix - next.key.unix)
			);
			if (correctedTime !== undefined) {
				closestCorrectUnixToReachNext = next.key.unix - correctedTime;
			}
		}

		this.closestCorrectUnixToTarget =
			Math.abs(closestCorrectUnixToReachPrevious - rescaledUnix) <=
			Math.abs(closestCorrectUnixToReachNext - rescaledUnix)
				? closestCorrectUnixToReachPrevious
				: closestCorrectUnixToReachNext;

		let couldRemove = true;
		if (
			(this._couldRemoveForPanEnclosing.next && rescaledUnix >= this._couldRemoveForPanEnclosing.next.key.unix) ||
			(this._couldRemoveForPanEnclosing.prev && rescaledUnix <= this._couldRemoveForPanEnclosing.prev.key.unix)
		) {
			couldRemove = this._couldRemoveForPan;
		}
		this._w.unix = rescaledUnix;

		// const conflictingNode = this.actor._states.get(this._w); // TODO: It finds itself

		this.invalidNodeForPan =
			closestCorrectUnixToReachPrevious === rescaledUnix &&
			closestCorrectUnixToReachNext === rescaledUnix &&
			couldRemove
				? undefined
				: node;

		this.cd.markForCheck();
		// VALIDATION END

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

		// only when shift is pressed
		if (this.closestCorrectUnixToTarget <= firstLimit) {
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
			this.finalizeNewPositions(!this.invalidNodeForPan);
			this.invalidNodeForPan = undefined;
			this.update();
		}
	}

	public correctedUnix(node: Node<UnixWrapper, ActorDelta>): number {
		if (node !== undefined) {
			if (node === this.invalidNodeForPan) {
				return this.closestCorrectUnixToTarget;
			} else {
				return node.key.unix;
			}
		} else {
			return undefined;
		}
	}

	@HostListener('panstart', ['$event'])
	@HostListener('panleft', ['$event'])
	@HostListener('panright', ['$event'])
	@HostListener('panup', ['$event'])
	@HostListener('pandown', ['$event'])
	@HostListener('panend', ['$event'])
	public pan($event: any): void {
		$event.stopPropagation();
		if ($event.type === 'panstart') {
			this.isPanning = true;
			for (const node of this.actor._states.nodes()) {
				this._originalUnixesForPan.set(node, node.key.unix);
			}
		}

		const ogFirstUnix = this._originalUnixesForPan.get(this.actor._states.nodes().next().value);
		const pos = this.nodePosition(ogFirstUnix) + this.left;
		const rescaledUnix = Math.floor(
			ThreeMath.mapLinear(pos + $event.deltaX, 0, this.containerWidth, this.frameStart, this.frameEnd)
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
		}
	}

	public isNodeInvalid(node: Node<UnixWrapper, ActorDelta>): boolean {
		return node === this.invalidNodeForPan;
	}

	private finalizeNewPositions(valid: boolean = true): void {
		this.isSaving = true;
		this.actor
			.atomicUpdate(a => {
				this.resetEveryNodeToOriginalUnix();
				if (valid) {
					this.loreService.overrideNodePosition.value.overrides.forEach(override => {
						const delta = this.actor._states.remove(new UnixWrapper(Math.floor(override.original)));
						if (delta) {
							this.actor._states.set(new UnixWrapper(Math.floor(override.new)), delta);
						}
					});
					a._states = this.actor._states;
				}
				return a;
			})
			.then(actor => {

				// this._originalUnixesForPan.clear();

				this.actor = actor;

				this.loreService.overrideNodePosition.next(undefined);
				this.isSaving = false;
			})
			.finally(() => {
				setTimeout(() => {
					this.actor = this.actor;
				}, 20);
			});
	}

	public resetEveryNodeToOriginalUnix(): void {
		for (const [key, val] of this._originalUnixesForPan.entries()) {
			key.key.unix = val;
		}
	}

	public tap($event: any, node: Node<UnixWrapper, ActorDelta>): void {
		$event.stopPropagation();
		this.blockService.selection.next({ block: this, node: node });
	}

	public select(node: Node<UnixWrapper, ActorDelta>): void {
		this.selection = node;
		this.jump.next(this.nodePosition(node.key.unix) + this.left);
		this.engineService.selectedByActor.next(this.actor);
		this.cd.markForCheck();
	}

	public deselect(): void {
		this.selection = undefined;
		this.cd.markForCheck();
	}

	public canRemove(node: Node<UnixWrapper, ActorDelta>): boolean {
		const { prev, next, speed } = this.surroundAndSpeed(node);
		let canDo = true;
		if (prev && next) {
			const diff = this.engineService.canReach(
				prev.value.position,
				next.value.position,
				speed,
				Math.abs(prev.key.unix - next.key.unix)
			);
			canDo = diff === undefined;
		}
		this.cd.markForCheck();
		return canDo;
	}

	public remove(node: Node<UnixWrapper, ActorDelta>, isDisabled: boolean): void {
		if (!isDisabled) {
			if (!this.isAtMostOneLeft) {
				this.dialog
					.open(ConfirmComponent)
					.afterClosed()
					.subscribe(result => {
						if (result) {
							this.blockService.selection.next(undefined);
							this.isSaving = true;
							this.actor._states.remove(node.key);

							if (this.blockEnd.value === node.key.unix) {
								this.blockEnd.override = this.actor._states.last().key.unix;
								this.blockEnd.bake();
							} else if (this.blockStart.value === node.key.unix) {
								this.blockStart.override = this.actor._states.first().key.unix;
								this.blockStart.bake();
							}

							this.cd.detectChanges();
							this.actor
								.atomicUpdate(a => (a._states = this.actor._states) && a)
								.then(() => {
									this.isSaving = false;
									this.update();
								});
						}
					});
			} else {
				this.dialog
					.open(ConfirmComponent)
					.afterClosed()
					.subscribe(result => {
						if (result) {
							this.isSaving = true;
							this.engineService.globe.removeActor(this.actor);
							this.actor.remove().then(() => {
								this.isSaving = false;
							});
						}
					});
			}
		}
	}

	public ngOnInit() {}

	public ngAfterViewInit(): void {
		this.teardown = this.storeFacade.frame$.subscribe(frame => {
			this._frameStart = frame.start;
			this._frameEnd = frame.end;
			this.update();
		});
		this.teardown = this.containerWidthListener.subscribe(width => {
			this.containerWidth = width;
		});
	}

	/**
	 * I'm marking the object as destroyed so the tear-down mechanic in the block-service would skip it's operation
	 */
	public ngOnDestroy(): void {
		super.ngOnDestroy();
		this.isDestroyed = true;
	}
}

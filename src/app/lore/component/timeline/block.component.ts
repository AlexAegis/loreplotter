import { Node } from '@alexaegis/avl';
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
import { Actor, ActorDelta } from '@app/model/data';
import { OverridableProperty } from '@app/model/overridable-property.class';
import { LoreService } from '@app/service';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { ConfirmComponent } from '@lore/component/dialog/confirm.component';
import { BlockService } from '@lore/service';
import { ActorEntity, AppState } from '@lore/store/reducers';
import { ActorDeltaEntity } from '@lore/store/reducers/actor-delta.reducer';
import { actorDeltaQuery } from '@lore/store/selectors';
import { StoreFacade } from '@lore/store/store-facade.service';
import { select, Store } from '@ngrx/store';
import { RxDocument } from 'rxdb';
import { combineLatest, Observable, Subject } from 'rxjs';
import { filter, flatMap, map, mergeMap, shareReplay, tap, withLatestFrom } from 'rxjs/operators';
import { del } from 'selenium-webdriver/http';
import { Math as ThreeMath } from 'three';

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
	public set actor(actor: Partial<ActorEntity>) {
		this._actor = actor;
		// this._actor._userdata = { block: this }; // TODO this is probably violating the frozen state
		console.log(this._actor.deltas);
		console.log(this.deltas);
	}

	public get deltas(): Array<Partial<ActorDeltaEntity>> {
		return actorDeltaQuery.raw.selectAll(this._actor.deltas);
	}

	public get actor(): Partial<ActorEntity> {
		return this._actor;
	}

	public deltas$: Observable<Array<Partial<ActorDeltaEntity>>>;
	public blockStart$: Observable<Partial<number>>;
	public blockEnd$: Observable<Partial<number>>;
	public frame$: Observable<{ start: number; end: number; length: number }>;

	constructor(
		public loreService: LoreService,
		public blockService: BlockService,
		private storeFacade: StoreFacade,
		public cd: ChangeDetectorRef,
		private dialog: MatDialog,
		private store$: Store<AppState>
	) {
		super();
		this.frame$ = this.storeFacade.frame$;
	}

	public get isAtMostOneLeft(): boolean {
		return this.actor.deltas.ids.length <= 1;
	}

	@Input()
	public containerWidthListener: Observable<number>;

	public isDestroyed = false;
	public faTrash = faTrash; // Node remove icon
	public isPanning = false;
	public isSaving = false;
	public selection: ActorDelta;

	@Output()
	public jump = new EventEmitter<number>();

	private _actor: Partial<ActorEntity>;

	@HostBinding('style.left.px')
	public left: number;

	@HostBinding('style.width.px')
	public width: number;
	// Used when moving the node in the database as the overrides 'previous' field is getting constantly updated
	// todo, use ID
	private _originalUnixesForPan: Map<ActorDelta, number> = new Map();
	// These field will hold the values for the boundaries of the block override while moving the last or the first node
	// So the block will never be smaller then it should
	private _afterFirstUnix: number;
	private _beforeLastUnix: number;

	public deltaDistance$ = (delta: Partial<ActorDeltaEntity>) =>
		combineLatest([this.blockStart$, this.blockEnd$, this.storeFacade.actorDeltaUnixes(this.actor)]).pipe(
			tap(a => {
				console.log('TERROR');
				console.log(a);
			}),
			map(([bs, be, deltas]) => {
				const d = deltas(delta.id);
				console.log(d);
				return this.width > 0 // If the width is 0, eg.: there's only one node, there's no point in mapping anything, it would produce a NaN
					? ThreeMath.mapLinear(d.unixOverride || d.unix, bs, be, 0, this.width)
					: 0;
			}),
			tap(a => console.log(`FINAL DESTIN: ${a}`))
		);
	/*
	private deltaPositions$ = combineLatest([this.blockStart$, this.blockEnd$]).pipe(
		mergeMap(([blockStart, blockEnd]) => this.storeFacade.actorDeltaUnixPositions(this.actor).pipe(map(deltas => ({deltas, blockStart, blockEnd})))),
		map(({deltas, blockStart, blockEnd}) =>
			deltas
			return this.width > 0 // If the width is 0, eg.: there's only one node, there's no point in mapping anything, it would produce a NaN
				? ThreeMath.mapLinear(
					delta.unixOverride || delta.unix,
					blockStart,
					blockEnd,
					0,
					this.width
				)
				: 0;
		})
	);*/

	public deltaPosition(delta: Partial<ActorDeltaEntity>): Observable<number> {
		return combineLatest([this.blockStart$, this.blockEnd$]).pipe(
			map(([blockStart, blockEnd]) => {
				return this.width > 0 // If the width is 0, eg.: there's only one node, there's no point in mapping anything, it would produce a NaN
					? ThreeMath.mapLinear(delta.unixOverride || delta.unix, blockStart, blockEnd, 0, this.width)
					: 0;
			})
		);
	}

	private deltaPanSubject = new Subject<{$event: HammerInput, delta: Partial<ActorDeltaEntity>}>();


	/**
	 * This method is for moving the nodes in a block to change the time of an event.
	 * To avoid unnecessary writes and reads from the database, during the pan, this is only an override
	 * and the actual writing happens only when the pan ends to the final position.
	 */
	public deltaPan($event: HammerInput, delta: Partial<ActorDeltaEntity>): void {
		($event as any).stopPropagation();
		console.log('DELTAPAAAN' + $event.type);
		this.deltaPanSubject.next({$event, delta});
	}

	@HostListener('panstart', ['$event'])
	@HostListener('panleft', ['$event'])
	@HostListener('panright', ['$event'])
	@HostListener('panup', ['$event'])
	@HostListener('pandown', ['$event'])
	@HostListener('panend', ['$event'])
	public pan($event: any): void {
		//$event.stopPropagation();
		//if ($event.type === 'panstart') {
		//	this.isPanning = true;
		//	for (const node of this.actor._states.nodes()) {
		//		this._originalUnixesForPan.set(node, node.key.unix);
		//	}
		//}
		//
		//const ogFirstUnix = this._originalUnixesForPan.get(this.actor._states.nodes().next().value);
		//const pos = this.nodePosition(ogFirstUnix) + this.left;
		//const rescaledUnix = ThreeMath.mapLinear(
		//	pos + $event.deltaX,
		//	0,
		//	this.containerWidth,
		//	this.frameStart,
		//	this.frameEnd
		//);
		//
		//const diff = rescaledUnix - ogFirstUnix;
		//const overrides = [];
		//for (const node of this.actor._states.nodes()) {
		//	const previous = node.key.unix;
		//	const ogUnix = this._originalUnixesForPan.get(node);
		//	// node.key.unix = ogUnix + diff; // ! HEY You can probably remove this
		//	overrides.push({
		//		original: ogUnix,
		//		previous: previous,
		//		new: ogUnix + diff
		//	});
		//}
		//
		//this.blockStart.override = this.actor._states.nodes().next().value.key.unix;
		//this.blockEnd.override = this.actor._states.reverseNodes().next().value.key.unix;
		//this.update();
		//this.loreService.overrideNodePosition.next({
		//	actorId: this._actor.id,
		//	overrides: overrides
		//});
		//
		//if ($event.type === 'panend') {
		//	this.isPanning = false;
		//	this.finalizeNewPositions();
		//}
	}

	private finalizeNewPositions(): void {
		//this.isSaving = true;
		//this.actor
		//	.atomicUpdate(a => {
		//		this.resetEveryNodeToOriginalUnix();
		//		this.loreService.overrideNodePosition.value.overrides.forEach(override => {
		//			const delta = this.actor._states.remove(new UnixWrapper(override.original)); // TODO Replace this with moveNode once it's fixed
		//			if (delta) {
		//				this.actor._states.set(new UnixWrapper(override.new), delta);
		//			}
		//		});
		//		a._states = this.actor._states;
		//		return a;
		//	})
		//	.then(actor => {
		//		this.loreService.overrideNodePosition.next(undefined);
		//		this._originalUnixesForPan.clear();
		//		this.isSaving = false;
		//		this.actor = actor;
		//	});
	}

	public resetEveryNodeToOriginalUnix(): void {
		//for (const [key, val] of this._originalUnixesForPan.entries()) {
		//	key.key.unix = val;
		//}
	}

	public tap($event: any, delta: ActorDeltaEntity): void {
		$event.stopPropagation();
		this.blockService.selection.next({ block: this, delta });
	}

	public select(delta: ActorDeltaEntity): void {
		// this.selection = node;
		// this.jump.next(this.nodePosition(node.key.unix) + this.left);
		// this.cd.detectChanges();
	}

	public deselect(): void {
		this.selection = undefined;
		this.cd.detectChanges();
	}

	public remove($event: any, delta: ActorDeltaEntity): void {
		//if (!this.isAtMostOneLeft) {
		//	//  TODO: Make hammer not ignore the disabled setting on buttons
		//	this.dialog
		//		.open(ConfirmComponent)
		//		.afterClosed()
		//		.subscribe(result => {
		//			if (result) {
		//				this.blockService.selection.next(undefined);
		//				this.isSaving = true;
		//				this.actor._states.remove(node.key);
		//
		//				if (this.blockEnd.value === node.key.unix) {
		//					this.blockEnd.override = this.actor._states.last().key.unix;
		//					this.blockEnd.bake();
		//				} else if (this.blockStart.value === node.key.unix) {
		//					this.blockStart.override = this.actor._states.first().key.unix;
		//					this.blockStart.bake();
		//				}
		//
		//				this.cd.detectChanges();
		//				this.actor
		//					.atomicUpdate(a => (a._states = this.actor._states) && a)
		//					.then(() => {
		//						this.isSaving = false;
		//						this.update();
		//					});
		//			}
		//		});
		//}
	}

	public ngOnInit() {}

	private panStartPos: number;

	public ngAfterViewInit(): void {
		this.deltas$ = this.storeFacade.actorDeltas(this.actor).pipe(
			tap(a => {
				// TODO The problem is that the deltas arent memoized correctly and refresh on the view
				console.log('Does this thing work?');
				console.log(a);
			}),
			shareReplay(1),
		);
		this.blockStart$ = this.deltas$.pipe(
			filter(deltas => deltas && deltas.length > 0),
			map(deltas => deltas[0]),
			map(delta => delta.unixOverride || delta.unix)
		);
		this.blockEnd$ = this.deltas$.pipe(
			filter(deltas => deltas && deltas.length > 0),
			map(deltas => deltas[deltas.length - 1]),
			map(delta => delta.unixOverride || delta.unix)
		);
		this.teardown(
			combineLatest([this.blockStart$, this.blockEnd$, this.frame$, this.containerWidthListener])
				.pipe()
				.subscribe(([blockStart, blockEnd, frame, width]) => {
					this.left = ThreeMath.mapLinear(blockStart, frame.start, frame.end, 0, width);
					const right = ThreeMath.mapLinear(blockEnd, frame.start, frame.end, 0, width);
					this.width = right - this.left;
					this.cd.markForCheck();
				})
		);

		this.teardown(this.deltaPanSubject.pipe(withLatestFrom(this.frame$, this.blockStart$)).subscribe(([{$event, delta}, f, bs]) => {
			if ($event.type === 'panstart') {

				this.panStartPos = ThreeMath.mapLinear(delta.unix, f.start, f.end, 0, this.width)
			}
			console.log('PANINI');
			const over = ThreeMath.mapLinear(this.panStartPos  + $event.deltaX, 0, this.width, f.start, f.end);
			console.log(over);
			console.log(delta.unix);
			this.storeFacade.setActorDeltaOverride(delta, over);


			// delta.unixOverride = ;
			if ($event.type === 'panend') {
				console.log('PANEND!!!')
				this.storeFacade.bakeActorDeltaOverride(delta);

				// delta.unix = delta.unixOverride;
				// delta.unixOverride = undefined;
			}
			/*
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
			this.finalizeNewPositions();
			this.update();
		}*/
		}));
	}

	/**
	 * I'm marking the object as destroyed so the tear-down mechanic in the block-service would skip it's operation
	 */
	public ngOnDestroy(): void {
		super.ngOnDestroy();
		this.isDestroyed = true;
	}
}

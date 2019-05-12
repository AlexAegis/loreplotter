import { Injectable, OnDestroy } from '@angular/core';
import { ActorDelta } from '@app/model/data';
import { withTeardown } from '@app/operator';
import { BlockComponent } from '@lore/component';
import { ActorDeltaEntity } from '@lore/store/reducers/actor-delta.reducer';
import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged, share } from 'rxjs/operators';


@Injectable()
export class BlockService implements OnDestroy {
	public selection = new BehaviorSubject<{ block: BlockComponent; delta: ActorDeltaEntity }>(undefined);

	public selection$ = this.selection.pipe(
		distinctUntilChanged(),
		/*withTeardown(
			item => item.block.select(item.delta),
			item => () => !item.block.isDestroyed && item.block.deselect()
		),*/
		share()
	);

	private sideEffectSubscription: Subscription;
	constructor() {
		this.sideEffectSubscription = this.selection$.subscribe();
	}

	public ngOnDestroy(): void {
		this.sideEffectSubscription.unsubscribe();
	}
}

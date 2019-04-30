import { ActorDelta } from '@app/model/actor-delta.class';
import { UnixWrapper } from '@app/model/unix-wrapper.class';
import { BlockComponent } from './block.component';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { distinctUntilChanged, share } from 'rxjs/operators';
import { Node } from '@alexaegis/avl';
import { withTeardown } from '@app/operator/with-teardown.operator';

@Injectable()
export class BlockService implements OnDestroy {
	public selection = new BehaviorSubject<{ block: BlockComponent; node: Node<UnixWrapper, ActorDelta> }>(undefined);

	public selection$ = this.selection.pipe(
		distinctUntilChanged(),
		withTeardown(
			item => item.block.select(item.node),
			item => () => !item.block.isDestroyed && item.block.deselect()
		),
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

import { ActorDelta } from 'src/app/model/actor-delta.class';
import { UnixWrapper } from 'src/app/model/unix-wrapper.class';
import { BlockComponent } from './block.component';
import { BehaviorSubject, EMPTY, merge, of, NEVER, Subscription } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import { distinctUntilChanged, switchMap, finalize, tap, share } from 'rxjs/operators';
import { Node } from '@alexaegis/avl';
import { withTeardown } from 'src/app/misc/with-teardown.function';

@Injectable({
	providedIn: 'root'
})
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

	private sideEffectSubsciption: Subscription;
	constructor() {
		this.sideEffectSubsciption = this.selection$.subscribe();
	}

	public ngOnDestroy(): void {
		this.sideEffectSubsciption.unsubscribe();
	}
}

import { Node } from '@alexaegis/avl';
import { Injectable, OnDestroy } from '@angular/core';
import { ActorDelta, UnixWrapper } from '@app/model/data';
import { withTeardown } from '@app/operator';
import { BlockComponent } from '@lore/component';
import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged, share } from 'rxjs/operators';
import { BaseDirective } from '@app/component/base-component.class';

@Injectable()
export class BlockService extends BaseDirective {
	public selection = new BehaviorSubject<{ block: BlockComponent; node: Node<UnixWrapper, ActorDelta> }>(undefined);

	public selection$ = this.selection.pipe(
		distinctUntilChanged(),
		withTeardown(
			item => item.block.select(item.node),
			item => () => !item.block.isDestroyed && item.block.deselect()
		),
		share()
	);

	public constructor() {
		super();
		this.teardown = this.selection$.subscribe();
	}
}

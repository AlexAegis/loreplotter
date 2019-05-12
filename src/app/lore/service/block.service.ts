import { Injectable } from '@angular/core';

// import { BlockComponent } from '@lore/component';

@Injectable()
export class BlockService /*implements OnDestroy */ {
	//public selection = new BehaviorSubject<{ block: BlockComponent; node: Node<UnixWrapper, ActorDelta> }>(undefined);
//
	//public selection$ = this.selection.pipe(
	//	distinctUntilChanged(),
	//	withTeardown(
	//		item => item.block.select(item.node),
	//		item => () => !item.block.isDestroyed && item.block.deselect()
	//	),
	//	share()
	//);
//
	//private sideEffectSubscription: Subscription;
	//constructor() {
	//	this.sideEffectSubscription = this.selection$.subscribe();
	//}
//
	//public ngOnDestroy(): void {
	//	this.sideEffectSubscription.unsubscribe();
	//}
}

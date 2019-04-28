import { of, OperatorFunction, Observable, EMPTY, merge, NEVER } from 'rxjs';
import { switchMap, finalize, tap } from 'rxjs/operators';

/**
 * Sideffect that can tear down the previous object when a new one enters. Can handle undefined and still
 * do the teardown on the last element
 *
 * Neither function will ever recieve undefined values.
 *
 * Example:
 *
 * You have multiple selectable objects. A BehaviorSubject holds the currently selected object.
 * Make a separate subscription on the subject for the side-effects, using this.
 *
 * With this OperatorFunction, the only thing you need to do for handling whats
 * selected and not is to update the Subject, and the pre defined functions will
 * keep the objects state correct.
 *
 * ```typescript
 * 	.pipe(
 * 		withTeardown(
 * 			item => item.select(), // This method get's called when the item enters the pipe
 *  		item => () => item.deselect() // If there was an item before anything entered the pipe, the inner function will fire
 * 		),
 * 	).subscribe();
 * ```
 *
 * Order of operations:
 *
 *   1. teardown
 *   2. activation
 *
 * @param activation will be called when a new item enters the pipe
 * @param teardown will be called on the previous item when a new item enters the pipe
 *
 * @author AlexAegis
 */
export function withTeardown<T>(activation: (t: T) => void, teardown: (t: T) => () => void): OperatorFunction<T, T> {
	return function tearDownOperation(source: Observable<T>): Observable<T> {
		return source.pipe(
			switchMap(t => (!t ? EMPTY : merge(of(t), NEVER).pipe(finalize(teardown(t))))),
			tap(activation)
		);
	};
}

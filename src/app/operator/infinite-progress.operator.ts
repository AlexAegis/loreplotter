import { of, Subject, Observable, OperatorFunction } from 'rxjs';
import { delay, tap, map, flatMap, mergeScan, reduce, finalize } from 'rxjs/operators';

/**
 * Over-time loader. This pipeline can be attached to a non-ending observable, though, you can't rely
 * on the `finalize()` operator for checking if the loading is done or not.
 * The observables you supply into it should be completeable.
 *
 * This can be extremely useful when you want that each of the 'loader' start as soon as possible, but still keep
 * track of the progress. At the last `tap()` you can always see when one loader finishes that how many observables
 * in the pipeline are still not complete.
 *
 * The source here is a subject to simulate delayed loading, though it can be anything
 *
 * Example:
 *
 * ```typescript
 * const load5 = of(true).pipe(delay(5000));
 * const load3 = of(true).pipe(delay(3000));
 * const load35 = of(true).pipe(delay(3500));
 * const load2 = of(true).pipe(delay(2000));
 * const load1 = of(true).pipe(delay(1000));
 *
 * const subject = new Subject<Observable<boolean>>();
 * subject.pipe(
 *	 take(5),
 *	 infiniteProgress(
 *		 ({ index, count, observable }) => console.log(`New member with index: ${index}!, So far ${count}!`),
 *		 ({ total, done, result, index }) =>
 *			 console.log(`${index}. finished! Progess: ${done}/${total}, result: ${result}`),
 *		 () => console.log(`You can only see me if the source completes!`)
 *	 )
 * ).subscribe();
 *
 * of(true)
 *	 .pipe(
 *		 delay(3500),
 *		 tap(undefined)
 *	 )
 *	 .subscribe(n => subject.next(load3));
 *
 * of(true)
 *	 .pipe(delay(4000))
 *	 .subscribe(n => subject.next(load5));
 *
 * of(true)
 *	 .pipe(delay(1500))
 *	 .subscribe(n => subject.next(load2));
 *
 * subject.next(load1);
 * subject.next(load35);
 * ```
 * (load2 means that the observable completes after 2 seconds, 35 is 3.5 seconds)
 *
 * Example output:
 *
 * ```bash
 * New member with index: 0!, So far 1!
 * New member with index: 1!, So far 2!
 * 0. finished! Progess: 1/2, result: true
 * New member with index: 2!, So far 3!
 * New member with index: 3!, So far 4!
 * 2. finished! Progess: 2/4, result: true
 * 1. finished! Progess: 3/4, result: true
 * New member with index: 4!, So far 5!
 * 3. finished! Progess: 4/5, result: true
 * 4. finished! Progess: 5/5, result: true
 * You can only see me if the source completes!
 * ```
 *
 * Notice that the upper boundary of out loading bar has increased!
 *
 * [Please check out my other loader-pipeline which expects a finite amount of loaders and only starts when
 * the source is completed!](https://gist.github.com/AlexAegis/610ce1e99369bbebfaad420c97a972bb)
 *
 * @param onEnter will be called when a new observable from the source gets subscribed onto
 * @param onProgress will be called when an observable inside the pipe has completed
 * @param onFinish will be called when the source and all the inner observables complete
 *
 * @author AlexAegis
 */
export function infiniteProgress<T>(
	onEnter?: (enter: { index: number; count: number; observable: Observable<T> }) => void,
	onProgress?: (progress: { result: T; done: number; total: number; index: number }) => void,
	onFinish?: () => void
): OperatorFunction<Observable<T>, T> {
	return function progressOperation(source: Observable<Observable<T>>): Observable<T> {
		return source.pipe(
			mergeScan((acc, next) => of((acc.index = acc.count++) !== undefined && (acc.observable = next) && acc), {
				index: 0,
				count: 0,
				observable: undefined as Observable<T>
			}),
			tap(onEnter),
			mergeScan(
				(acc, { index, count, observable }) => {
					acc.total = acc.total < count ? count : acc.total;
					acc.index = index;
					return observable.pipe(
						map(next => {
							acc.result = next;
							acc.index = index;
							acc.finised.push(count);
							return acc;
						})
					);
				},
				{ finised: [], total: 0, index: 0, result: undefined as T }
			),
			map(({ finised, total, result, index }) => ({
				done: finised.length,
				total,
				result,
				index
			})),
			tap(onProgress),
			finalize(onFinish),
			map(({ result }) => result)
		);
	};
}

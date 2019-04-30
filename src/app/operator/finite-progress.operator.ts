import { Observable, OperatorFunction } from 'rxjs';
import { tap, map, flatMap, mergeScan, reduce, finalize } from 'rxjs/operators';

/**
 * This loader-manager pipeline should be attached to an observable that contains
 * a finite amount of observables (preferably using an of(), like here.)
 *
 * Loading starts when the source completes!
 *
 * These observables should be expected to complete, as the pipeline will
 * only complete when every element of it completes!
 *
 * First it collects and counts every element, using a `tap()` you can extract this information
 * (Like setting the `goal` of a loading bar)
 *
 * Then the pipeline gets flattened to allow for parallel execution, and then a mergeMap
 * subscribe to the inner observable.
 *
 * After this, in another `tap()`, you can update your loading bar's progress
 *
 * The finalize at the end can be used to close the loading screen!
 *
 *
 * Example usage:
 *
 * ```typescript
 * const load5 = of(true).pipe(delay(5000));
 * const load3 = of(true).pipe(delay(3000));
 * const load35 = of(true).pipe(delay(3500));
 * const load2 = of(true).pipe(delay(2000));
 * const load1 = of(true).pipe(delay(1000));
 *
 *
 * of(load5, load3, load35, load2, load1)
 *  .pipe(
 *  finiteProgress(
 * 	 ({ total, observables }) => console.log(`${total} loaders loaded, loading initiated!`),
 * 	 ({ done, total, result, index }) =>
 * 		 console.log(`${index}. finished loading! Progress ${done}/${total} Result: ${result}`),
 * 	 () => console.log('Finished!')
 *  )
 * )
 * .subscribe();
 * ```
 *
 * Example output:
 *
 * ```bash
 * 5 loaders loaded, loading initiated!
 * 4. finished loading! Progress 1/5 Result: true
 * 3. finished loading! Progress 2/5 Result: true
 * 1. finished loading! Progress 3/5 Result: true
 * 2. finished loading! Progress 4/5 Result: true
 * 0. finished loading! Progress 5/5 Result: true
 * Loading finished!
 * ```
 *
 * [Please check out my other loader-pipeline which can be listen to observables over-time, and raise the
 * upper boundary of the progress even mid-loading! Using that the loading (The listening to the inner observables,
 * starts immediately, and the source doesn't have to complete!)](https://gist.github.com/AlexAegis/85705cc332d98178dd18c03b06ce1525)
 *
 * @param onStart will be called when the source observable completes
 * @param onProgress will be called when an observable inside the pipe has completed
 * @param onFinish will be called when all the inner observables complete
 *
 * @author AlexAegis
 */
export function finiteProgress<T>(
	onStart?: (start: { total: number; observables: Array<Observable<T>> }) => void,
	onProgress?: (progress: { result: T; done: number; total: number; index: number }) => void,
	onFinish?: () => void
): OperatorFunction<Observable<T>, T> {
	return function progressOperation(source: Observable<Observable<T>>): Observable<T> {
		return source.pipe(
			map(observable => ({ total: 0, observables: [observable] })),
			reduce(
				(acc, next) => {
					acc.total++;
					acc.observables.push(...next.observables);
					return acc;
				},
				{ total: 0, observables: [] as Array<Observable<T>> }
			),
			tap(onStart),
			flatMap(({ total, observables }) => observables.map((observable, index) => ({ total, index, observable }))),
			mergeScan(
				(acc, { total, index, observable }) => {
					acc.total = acc.total < total ? total : acc.total;
					acc.index = index;
					return observable.pipe(
						map(next => {
							acc.result = next;
							acc.index = index;
							acc.finished.push(index);
							return acc;
						})
					);
				},
				{ finished: [], total: 0, index: 0, result: undefined as T }
			),
			map(({ finished, total, result, index }) => ({
				done: finished.length,
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

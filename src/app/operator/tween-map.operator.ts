import { Observable, OperatorFunction, BehaviorSubject } from 'rxjs';
import { mergeMap, filter } from 'rxjs/operators';

import { Tween, Easing } from '@tweenjs/tween.js';

export interface Tweenable<T> {
	from: T;
	to: T;
}

/**
 * Can transform a `Tweenable` pipe into it's tweened values
 *
 * Example:
 * This pipe could be listened to turn the lighness level of a lamp
 * to 1 by calling `turnLamp.next(true)`. Or turning it off by `turnLamp.next(false)`
 *
 * Because both pingpong settings are true, subsequent calls of the same boolean value
 * (Same could be achieved with a `distinctUntilChanged()` operator before this, in this case)
 *
 * ```typescript
 * const turnLamp = new BehaviorSubject<boolean>(false);
 * const darkToLight = { from: { light: 0 }, to: { light: 1 } };
 * const lightToDark = { from: { light: 1 }, to: { light: 0 } };
 * turnLamp
 * 		.pipe(
 * 			map(next => next ?  darkToLight : lightToDark),
 * 			tweenMap(1000, TWEEN.Easing.Exponential.Out, true, true),
 * 		)
 * 		.subscribe(next => {
 * 			console.log(next);
 * 		});
 * ```
 *
 * @param duration the duration of the tween
 * @param easing function for the tween
 * @param pingpongInterrupt if true, then upon interrupting the tween, instead of the supplied from object,
 * 		the tween will use the last emitted object.
 * @param pingpongAfterFinish if true, `pingpongInterrupt` will be forcibly turn on. This extends the
 * 		pingpong effect after the tween has finished. (always ignoring the from: object, except the first time)
 *
 * @author AlexAegis
 */
export function tweenMap<T>(
	duration: number = 1000,
	easing: (k: number) => number = Easing.Linear.None,
	pingpongInterrupt: boolean = true,
	pingpongAfterFinish: boolean = true
): OperatorFunction<Tweenable<T>, T> {
	return function tweenOperation(source: Observable<Tweenable<T>>): Observable<T> {
		const innerSubject = new BehaviorSubject<T>(undefined);
		let lastTween: Tween;
		if (pingpongAfterFinish) {
			pingpongInterrupt = true;
		}
		return source.pipe(
			mergeMap(nextInput => {
				if (lastTween) {
					lastTween.stop();
				}
				lastTween = new Tween(pingpongInterrupt && innerSubject.value ? innerSubject.value : nextInput.from)
					.to(nextInput.to, duration)
					.easing(easing)
					.onUpdate(next => innerSubject.next(next))
					.onComplete(next =>
						pingpongInterrupt && pingpongAfterFinish
							? innerSubject.next(next)
							: innerSubject.next(undefined)
					)
					.start(Date.now());
				return innerSubject.asObservable().pipe(filter(next => next !== undefined));
			})
		);
	};
}

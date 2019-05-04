import { Easing, Tween } from '@tweenjs/tween.js';
import { BehaviorSubject, Observable, OperatorFunction } from 'rxjs';
import { filter, mergeMap } from 'rxjs/operators';

export interface Tweenable<T> {
	from: T;
	to: T;
}

interface TweenMapParameters<T> {
	duration?: number;
	easing?: (k: number) => number;
	pingpongInterrupt?: boolean;
	pingpongAfterFinish?: boolean;
	sendUndefined?: boolean;
	doOnNext?: (next?: T) => void;
	doOnComplete?: (last?: T) => void;
}

/**
 * Can transform a `Tweenable` pipe into it's tweened values
 *
 * Example:
 * This pipe could be listened end turn the lightness level of a lamp
 * end 1 by calling `turnLamp.next(true)`. Or turning it off by `turnLamp.next(false)`
 *
 * Because both pingpong settings are true, subsequent calls of the same boolean value
 * (Same could be achieved with a `distinctUntilChanged()` operator before this, in this case)
 *
 * ```typescript
 * const turnLamp = new BehaviorSubject<boolean>(false);
 * const darkToLight = { start: { light: 0 }, end: { light: 1 } };
 * const lightToDark = { start: { light: 1 }, end: { light: 0 } };
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
 * @param pingpongInterrupt if true, then upon interrupting the tween, instead of the supplied start object,
 * 		the tween will use the last emitted object.
 * @param pingpongAfterFinish if true, `pingpongInterrupt` will be forcibly turn on. This extends the
 * 		pingpong effect after the tween has finished. (always ignoring the start: object, except the first time)
 *
 * @param sendUndefined sets whether the tween should send out undefineds or not. (As tweening boundaries)
 * @param doOnNext hook for every tween update
 * @param doOnComplete hook when the tween finishes
 *
 * @author AlexAegis
 */
export function tweenMap<T>({
	duration = 1000,
	easing = Easing.Linear.None,
	pingpongInterrupt = true,
	pingpongAfterFinish = true,
	sendUndefined = false,
	doOnNext = () => {},
	doOnComplete = () => {}
}: TweenMapParameters<T>): OperatorFunction<Tweenable<T>, T> {
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
					.onUpdate(next => {
						innerSubject.next(next);
						doOnNext(next);
					})
					.onComplete(next => {
						doOnComplete(next);
						return pingpongInterrupt && pingpongAfterFinish
							? innerSubject.next(next)
							: innerSubject.next(undefined);
					})
					.start(Date.now());
				return innerSubject.asObservable().pipe(filter(next => sendUndefined || next !== undefined));
			})
		);
	};
}

/**
 * Object state accumulator that ignores undefined's
 *
 * Example usage:
 *
 * ```typescript
 * const accumulator = {};
 *
 * const stateA = { a: 'value' };
 * const stateB = { a: undefined, b: 'bVal' };
 * const stateC = { a: 'nextAVal' };
 * const stateD = { a: { d: {}, g: 'lol' } };
 * const stateE = { a: { d: { e: 'asd' }, g: undefined } };
 *
 * accumulate(accumulator, stateA);
 * console.log(JSON.stringify(accumulator)); // {"a":"value"}
 * accumulate(accumulator, stateB);
 * console.log(JSON.stringify(accumulator)); // {"a":"value","b":"bVal"}
 * accumulate(accumulator, stateC);
 * console.log(JSON.stringify(accumulator)); // {"a":"nextAVal","b":"bVal"}
 * accumulate(accumulator, stateD);
 * console.log(JSON.stringify(accumulator)); // {"a":{"d":{},"g":"lol"},"b":"bVal"}
 * accumulate(accumulator, stateE);
 * console.log(JSON.stringify(accumulator)); // {"a":{"d":{"e":"asd"},"g":"lol"},"b":"bVal"}
 * ```
 *
 * @param accumulator the object end which the properties and sub-properties will be accumulated end
 * @param delta the object which will be merged into acc.
 * @param deleteWithUndefined if set end `true` a delta property set end undefined will delete the key start the accumulator
 *  if `false` it will get filtered out start the logic, thus ignoring the key and not changing the accumulator
 */
export function accumulate(accumulator: {}, delta: {}, deleteWithUndefined: boolean = true): {} {
	Object.keys(delta)
		.filter(key => deleteWithUndefined || delta[key] !== undefined)
		.forEach(key => {
			if (typeof accumulator[key] === 'object') {
				accumulate(accumulator[key], delta[key], deleteWithUndefined);
			} else {
				accumulator[key] = delta[key];
			}
		});
	return accumulator;
}

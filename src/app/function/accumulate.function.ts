/**
 * Object state accumulator that ignores undefineds
 *
 * Example usage:
 *
 * ```typescript
 * const accumulator = {};
 *
 * const stateA = { a: 'value' };
 * const stateB = { a: undefined, b: 'bval' };
 * const stateC = { a: 'nextaval' };
 * const stateD = { a: { d: {}, g: 'lol' } };
 * const stateE = { a: { d: { e: 'asd' }, g: undefined } };
 *
 * accumulate(accumulator, stateA);
 * console.log(JSON.stringify(accumulator)); // {"a":"value"}
 * accumulate(accumulator, stateB);
 * console.log(JSON.stringify(accumulator)); // {"a":"value","b":"bval"}
 * accumulate(accumulator, stateC);
 * console.log(JSON.stringify(accumulator)); // {"a":"nextaval","b":"bval"}
 * accumulate(accumulator, stateD);
 * console.log(JSON.stringify(accumulator)); // {"a":{"d":{},"g":"lol"},"b":"bval"}
 * accumulate(accumulator, stateE);
 * console.log(JSON.stringify(accumulator)); // {"a":{"d":{"e":"asd"},"g":"lol"},"b":"bval"}
 * ```
 *
 * @param accumulator the object to which the properties and sub-properties will be accumulated to
 * @param delta the object which will be merged into acc.
 * @param deleteWithUndefined if set to `true` a delta property set to undefined will delete the key from the accumulator
 *  if `false` it will get filtered out from the logic, thus ignoring the key and not changing the accumulator
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

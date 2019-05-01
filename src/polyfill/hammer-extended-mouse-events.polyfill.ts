import * as Hammer from 'hammerjs/hammer';

/**
 * * Enabling other mouse buttons for the events https://stackoverflow.com/a/30053420
 * TODO: Test on other browsers
 */

/**
 * * This is from hammerjs/src/utils.js as is, no changes
 */
function inArray(src, find, findByKey) {
	if (src.indexOf && !findByKey) {
		return src.indexOf(find);
	} else {
		let i = 0;
		while (i < src.length) {
			// tslint:disable-next-line: triple-equals
			if ((findByKey && src[i][findByKey] == find) || (!findByKey && src[i] === find)) {
				return i;
			}
			i++;
		}
		return -1;
	}
}

/**
 * * These are from hammerjs/src/input/pointerevent.js
 *
 * * changes were made to allow for the recognition of other mouse buttons, these are marked with comments
 * * so whenever this event changes in a future hammer update you can edit that accordingly (Marked with 'CHANGE:')
 *
 * * The only other changes are namespace a type related, wherever you see 'Hammer.' or '(Hammer as any).', thats a change too.
 */
const POINTER_INPUT_MAP = {
	pointerdown: Hammer.INPUT_START,
	pointermove: Hammer.INPUT_MOVE,
	pointerup: Hammer.INPUT_END,
	pointercancel: Hammer.INPUT_CANCEL,
	pointerout: Hammer.INPUT_CANCEL
};

// in IE10 the pointer types is defined as an enum
const IE10_POINTER_TYPE_ENUM = {
	2: (Hammer as any).INPUT_TYPE_TOUCH,
	3: (Hammer as any).INPUT_TYPE_PEN,
	4: (Hammer as any).INPUT_TYPE_MOUSE,
	5: (Hammer as any).INPUT_TYPE_KINECT // see https://twitter.com/jacobrossi/status/480596438489890816
};

Hammer.inherit(Hammer.PointerEventInput as any, Hammer.Input as any, {
	handler: function PEhandler(ev) {
		const store = this.store;
		let removePointer = false;

		const eventTypeNormalized = ev.type.toLowerCase().replace('ms', '');
		const eventType = POINTER_INPUT_MAP[eventTypeNormalized];
		const pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;

		// tslint:disable-next-line: triple-equals
		const isTouch = pointerType == (Hammer as any).INPUT_TYPE_TOUCH;

		// get index of the event in the store
		let storeIndex = inArray(store, ev.pointerId, 'pointerId');

		// start and mouse must be down
		// ? CHANGE: ev.button === 0 changed into: ev.button <= 2
		if (eventType & (Hammer as any).INPUT_START && (ev.button <= 2 || isTouch)) {
			this.button = ev.button; // ? CHANGE: new line, save the reference because while panning the buttons code is not sent
			if (storeIndex < 0) {
				store.push(ev);
				storeIndex = store.length - 1;
			}
		} else {
			// noinspection JSBitwiseOperatorUsage
			if (eventType & ((Hammer as any).INPUT_END | (Hammer as any).INPUT_CANCEL)) {
				removePointer = true;
			}
		}

		// it not found, so the pointer hasn't been down (so it's probably a hover)
		if (storeIndex < 0) {
			return;
		}

		// update the event in the store
		store[storeIndex] = ev;

		this.callback(this.manager, eventType, {
			button: this.button, // ? CHANGE: Also send the button to the event
			pointers: store,
			changedPointers: [ev],
			pointerType: pointerType,
			srcEvent: ev
		});

		if (removePointer) {
			// remove from the store
			store.splice(storeIndex, 1);
		}
		this.button = undefined; // ? CHANGE: new line
	}
});

import { Injectable } from '@angular/core';
import { HammerGestureConfig } from '@angular/platform-browser';
import * as Hammer from 'hammerjs';

@Injectable({ providedIn: 'root' })
export class MyHammerConfig extends HammerGestureConfig {
	overrides = <any>{
		pan: {
			direction: Hammer.DIRECTION_ALL,
			threshold: 0,
			domEvents: true,
			options: { domEvents: true }
		}, // TODO what
		swipe: { velocity: 0.4, threshold: 20, domEvents: true, options: { domEvents: true } } // override default settings
	};
}

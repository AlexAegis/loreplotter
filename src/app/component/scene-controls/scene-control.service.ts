import { BehaviorSubject, merge, EMPTY, NEVER, of } from 'rxjs';
import { Injectable } from '@angular/core';
import {
	faArrowsAlt,
	faAngleDoubleUp,
	faAngleDoubleDown,
	faPencilAlt,
	IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { distinctUntilChanged, switchMap, tap, finalize, share } from 'rxjs/operators';

export interface Modes {
	move: Mode;
	raise: Mode;
	lower: Mode;
	draw: Mode;
}

export class Mode {
	active = false;
	constructor(public icon: IconDefinition, public slider = false) {}
}

@Injectable({
	providedIn: 'root'
})
export class SceneControlService {
	public mode: Modes = {
		move: new Mode(faArrowsAlt),
		raise: new Mode(faAngleDoubleUp, true),
		lower: new Mode(faAngleDoubleDown, true),
		draw: new Mode(faPencilAlt, true)
	};

	public modes = [this.mode.move, this.mode.draw];

	public activeMode = new BehaviorSubject<Mode>(this.mode.move);

	public activeMode$ = this.activeMode.pipe(
		distinctUntilChanged(),
		switchMap(item => (!item ? EMPTY : merge(of(item), NEVER).pipe(finalize(() => (item.active = false))))),
		tap(item => (item.active = true)),
		share()
	);

	public valueSlider = new BehaviorSubject<number>(0.5);
	public sizeSlider = new BehaviorSubject<number>(2);

	constructor() {
		this.activeMode$.subscribe();
	}

	public isMoving(): boolean {
		return this.is(this.mode.move);
	}

	public isRaising(): boolean {
		return this.is(this.mode.raise);
	}

	public isLowering(): boolean {
		return this.is(this.mode.lower);
	}

	public isDraw(): boolean {
		return this.is(this.mode.draw);
	}

	private is(mode: Mode) {
		return this.activeMode.value === mode;
	}
}

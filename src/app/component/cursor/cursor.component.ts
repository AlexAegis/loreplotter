import { Moment } from 'moment';
import * as moment from 'moment';
import { Component, OnInit, HostListener, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { normalize } from 'src/app/misc/normalize.function';

@Component({
	selector: 'app-cursor',
	templateUrl: './cursor.component.html',
	styleUrls: ['./cursor.component.scss']
})
export class CursorComponent implements OnInit {
	private _position = 0;
	private _deltaPosition = 0;

	private _containerWidth: number;

	@Input('containerWidth')
	public set containerWidth(width: number) {
		const prevWidth = this._containerWidth;
		this._containerWidth = width;
		this.position = normalize(this._position, 0, prevWidth, 0, this._containerWidth);
	}

	private _timeFrame: moment.unitOfTime.DurationConstructor;

	@Input('timeFrame')
	public set timeFrame(timeFrame: moment.unitOfTime.DurationConstructor) {
		this._timeFrame = timeFrame;
	}

	private _timeBeginning: Moment;

	@Input('timeBeginning')
	public set timeBeginning(timeBeginning: Moment) {
		this._timeBeginning = timeBeginning;
		this.changed();
	}

	@Output()
	public timeChange = new EventEmitter<Moment>();

	private set position(position: number) {
		this._position = position;
		this.changed();
	}

	private get position(): number {
		return this._position || 0;
	}

	private set deltaPosition(deltaPosition: number) {
		this._deltaPosition = deltaPosition;
		this.changed();
	}

	private get deltaPosition(): number {
		return this._deltaPosition || 0;
	}

	constructor() {}

	ngOnInit() {}

	changed() {
		//console.log(`position changed: ${this.totalPosition}`);
		// this.timeChange.emit();
	}

	@HostListener('pan', ['$event'])
	panHandler($event: any) {
		if (this.position + $event.deltaX >= 0 && this.position + $event.deltaX <= this._containerWidth) {
			this.deltaPosition = $event.deltaX;
		}
		if ($event.isFinal) {
			if (!this._position) {
				this._position = 0;
			}
			this._position += this.deltaPosition; // To avoid double call of this.changed();
			this.deltaPosition = 0;
		}
	}

	@HostBinding('style.left') get positionPx(): string {
		return `${this.totalPosition}px`;
	}

	get totalPosition(): number {
		return this.deltaPosition + this.position;
	}
}

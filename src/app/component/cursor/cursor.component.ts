import { LoreService } from './../../service/lore.service';
import { Moment } from 'moment';
import * as moment from 'moment';
import { Component, OnInit, HostListener, HostBinding, Input, Output, EventEmitter } from '@angular/core';
import { rescale } from 'src/app/misc/rescale.function';

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
		const prevWidth = this._containerWidth || width;
		this._containerWidth = width;
		this.position = rescale(this._position, 0, prevWidth, 0, this._containerWidth);
		this.contextChange();
	}

	private _frame: Moment;

	@Input('frame')
	public set frame(frame: Moment) {
		this._frame = frame;
		this.contextChange();
	}

	private _timeBeginning: Moment;

	@Input('timeBeginning')
	public set timeBeginning(timeBeginning: Moment) {
		this._timeBeginning = timeBeginning;
		this.contextChange();
	}

	private _offset: number;

	@Input('offset')
	public set offset(offset: number) {
		this._offset = offset;
		this.contextChange();
	}

	public set position(position: number) {
		this._position = position;
		// this.changed();
	}

	public get position(): number {
		return this._position || 0;
	}

	private set deltaPosition(deltaPosition: number) {
		this._deltaPosition = deltaPosition;
		this.changed();
	}

	private get deltaPosition(): number {
		return this._deltaPosition || 0;
	}

	constructor(private loreService: LoreService) {}

	ngOnInit() {}

	/**
	 * This function calculates the date the cursor is pointing at
	 */
	changed(): void {
		if (this._timeBeginning && this._frame) {
			const momentFromUnix = moment.unix(
				rescale(this.totalPosition, 0, this._containerWidth, this._timeBeginning.unix(), this._frame.unix())
			);
			this.loreService.cursor$.next(momentFromUnix);
		}
	}

	/**
	 * This function updates the cursor's position based on the environment
	 */
	contextChange(): void {
		if (this._timeBeginning && this._frame) {
			// console.log(`_timeBeginning : ${this._timeBeginning.format('YYYY-MM-DD HH:mm')}`);
			// console.log(`_frame : ${this._frame.format('YYYY-MM-DD HH:mm')}`);
			this.position = rescale(
				this.loreService.cursor$.value.unix(),
				this._timeBeginning.unix(),
				this._frame.unix(),
				0,
				this._containerWidth
			);
		}
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
			this._position += this.deltaPosition;
			this.deltaPosition = 0;
		}
	}

	@HostBinding('style.left') get positionPx(): string {
		return `${this.totalPosition}px`;
	}

	get totalPosition(): number {
		return this.deltaPosition + this.position + this._offset;
	}
}

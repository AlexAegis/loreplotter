import { LoreService } from './../../service/lore.service';
import { Moment } from 'moment';
import * as moment from 'moment';
import {
	Component,
	OnInit,
	HostListener,
	HostBinding,
	Input,
	Output,
	EventEmitter,
	ChangeDetectionStrategy
} from '@angular/core';
import { rescale } from 'src/app/misc/rescale.function';

@Component({
	selector: 'app-cursor',
	templateUrl: './cursor.component.html',
	styleUrls: ['./cursor.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CursorComponent implements OnInit {
	@Input('containerWidth')
	public set containerWidth(width: number) {
		const prevWidth = this._containerWidth || width;
		this._containerWidth = width;
		this.position = rescale(this._position, 0, prevWidth, 0, this._containerWidth);
		this.contextChange();
	}

	public get containerWidth(): number {
		return this._containerWidth;
	}

	@Input()
	public set frameEnd(frameEnd: Moment) {
		console.log('FrameEnd changed in cursor!!');
		this._frameEnd = frameEnd;
		this.contextChange();
	}

	@Input()
	public set frameStart(frameStart: Moment) {
		this._frameStart = frameStart;
		this.contextChange();
	}

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
	@HostBinding('style.left') get positionPx(): string {
		return `${this.totalPosition}px`;
	}

	get totalPosition(): number {
		return this.deltaPosition + this.position + this._offset;
	}

	private _position = 0;
	private _deltaPosition = 0;

	private _containerWidth: number;

	private _frameEnd: Moment;

	private _frameStart: Moment;

	private _offset: number;

	public _totalPosition = 0;

	ngOnInit() {}

	/**
	 * This function calculates the date the cursor is pointing at
	 */
	changed(): void {
		if (this._frameStart && this._frameEnd) {
			const momentFromUnix = moment.unix(
				rescale(
					this.totalPosition,
					0 + this._offset,
					this._containerWidth + this._offset,
					this._frameStart.unix(),
					this._frameEnd.unix()
				)
			);
			this.loreService.cursor$.next(momentFromUnix);
		}
	}

	/**
	 * This function updates the cursor's position based on the environment
	 */
	contextChange(): void {
		if (this._frameStart && this._frameEnd) {
			this.position = rescale(
				this.loreService.cursor$.value.unix(),
				this._frameStart.unix(),
				this._frameEnd.unix(),
				0,
				this._containerWidth
			);
		}
	}

	@HostListener('pan', ['$event'])
	panHandler($event: any) {
		if (
			this.position + this._offset + $event.deltaX >= 0 &&
			this.position + this._offset + $event.deltaX <= this._containerWidth
		) {
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

	get progress(): number {
		return rescale(this.position, 0, this._containerWidth, 0, 1);
	}
}

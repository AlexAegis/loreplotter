import { Component, OnInit, HostListener, HostBinding, Input } from '@angular/core';
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
		if (this._containerWidth) {
			this.position = normalize(this._position, 0, this._containerWidth, 0, width);
		}
		this._containerWidth = width;
	}

	private set position(position: number) {
		this._position = position;
		this.changed();
	}

	private set deltaPosition(deltaPosition: number) {
		this._deltaPosition = deltaPosition;
		this.changed();
	}

	constructor() {}

	ngOnInit() {}

	changed() {
		console.log(`position changed: ${this.totalPosition}`);
	}

	@HostListener('pan', ['$event'])
	panHandler($event: any) {
		if (this._position + $event.deltaX >= 0 && this._position + $event.deltaX <= this._containerWidth) {
			this.deltaPosition = $event.deltaX;
		}
		if ($event.isFinal) {
			this._position += this._deltaPosition; // To avoid double call of this.changed();
			this.deltaPosition = 0;
		}
	}

	@HostBinding('style.left') get positionPx(): string {
		return `${this.totalPosition}px`;
	}

	get totalPosition(): number {
		return this._deltaPosition + this._position;
	}
}

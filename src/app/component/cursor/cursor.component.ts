import { ChangeDetectionStrategy, Component, HostBinding, HostListener, Input, OnInit } from '@angular/core';
import { LoreService } from './../../service/lore.service';
import * as THREE from 'three';
import { Observable } from 'rxjs';

@Component({
	selector: 'app-cursor',
	templateUrl: './cursor.component.html',
	styleUrls: ['./cursor.component.scss']
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class CursorComponent implements OnInit {
	@Input('containerWidth')
	public set containerWidth(width: number) {
		const prevWidth = this._containerWidth || width;
		this._containerWidth = width;
		this.position = THREE.Math.mapLinear(this._position, 0, prevWidth, 0, this._containerWidth);
		this.contextChange();
	}

	public get containerWidth(): number {
		return this._containerWidth;
	}

	@Input()
	public set frameEnd(frameEnd: number) {
		this._frameEnd = frameEnd;
		this.contextChange();
	}

	@Input()
	public set frameStart(frameStart: number) {
		this._frameStart = frameStart;
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

	public cursor$: Observable<number>;

	constructor(private loreService: LoreService) {
		this.cursor$ = this.loreService.cursor$;
	}

	@HostBinding('style.left') get positionPx(): string {
		return `${this.totalPosition}px`;
	}

	get totalPosition(): number {
		return this.deltaPosition + this.position;
	}

	private _position = 0;
	private _deltaPosition = 0;

	private _containerWidth: number;

	private _frameEnd: number;

	private _frameStart: number;

	public _totalPosition = 0;

	ngOnInit() {}

	/**
	 * This function calculates the date the cursor is pointing at
	 */
	changed(): void {
		if (this._frameStart && this._frameEnd) {
			this.loreService.cursor$.next(
				THREE.Math.mapLinear(this.totalPosition, 0, this._containerWidth, this._frameStart, this._frameEnd)
			);
		}
	}

	/**
	 * This function updates the cursor's position based on the environment
	 */
	contextChange(): void {
		this.position = THREE.Math.mapLinear(
			this.loreService.cursor$.value,
			this._frameStart,
			this._frameEnd,
			0,
			this._containerWidth
		);
	}

	@HostListener('panstart', ['$event'])
	@HostListener('panleft', ['$event'])
	@HostListener('panright', ['$event'])
	@HostListener('panup', ['$event'])
	@HostListener('pandown', ['$event'])
	@HostListener('panend', ['$event'])
	panHandler($event: any) {
		$event.stopPropagation();
		if (this.position + $event.deltaX >= 0 && this.position + $event.deltaX <= this._containerWidth) {
			this.deltaPosition = $event.deltaX;
		}
		if ($event.type === 'panend') {
			if (!this._position) {
				this._position = 0;
			}
			this._position += this.deltaPosition;
			this.deltaPosition = 0;
		}
	}

	get progress(): number {
		return THREE.Math.mapLinear(this.position, 0, this._containerWidth, 0, 1);
	}
}

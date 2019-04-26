import { ChangeDetectionStrategy, Component, HostBinding, HostListener, Input, OnInit } from '@angular/core';
import { LoreService } from './../../service/lore.service';
import * as THREE from 'three';
import { Observable } from 'rxjs';
import { DeltaProperty } from 'src/app/model/delta-property.class';

@Component({
	selector: 'app-cursor',
	templateUrl: './cursor.component.html',
	styleUrls: ['./cursor.component.scss']
	// changeDetection: ChangeDetectionStrategy.OnPush
})
export class CursorComponent implements OnInit {
	private position = new DeltaProperty();

	@Input('containerWidth')
	public set containerWidth(width: number) {
		const prevWidth = this._containerWidth || width;
		this._containerWidth = width;
		this.position.base = THREE.Math.mapLinear(this.position.base, 0, prevWidth, 0, this._containerWidth);
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

	public cursor$: Observable<number>;

	constructor(private loreService: LoreService) {
		this.cursor$ = this.loreService.cursor$;
	}

	@HostBinding('style.left.px') get positionPx(): number {
		// console.log(this._pos);
		return this.position.total;
	}

	private _containerWidth: number;

	private _frameEnd: number;

	private _frameStart: number;

	ngOnInit() {}

	/**
	 * This function calculates the date the cursor is pointing at
	 */
	changed(): void {
		if (this._frameStart && this._frameEnd) {
			this.loreService.cursor$.next(
				THREE.Math.mapLinear(this.position.total, 0, this._containerWidth, this._frameStart, this._frameEnd)
			);
		}
	}

	/**
	 * This function updates the cursor's position based on the environment
	 */
	contextChange(): void {
		this.position.base = THREE.Math.mapLinear(
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
		if (this.position.base + $event.deltaX >= 0 && this.position.base + $event.deltaX <= this._containerWidth) {
			this.position.delta = $event.deltaX;
		}
		this.changed();
		if ($event.type === 'panend') {
			this.position.bake();
		}
	}

	get progress(): number {
		return THREE.Math.mapLinear(this.position.total, 0, this._containerWidth, 0, 1);
	}
}

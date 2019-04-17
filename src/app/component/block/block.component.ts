import { Component, OnInit, Input, HostBinding, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Actor } from 'src/app/model/actor.class';
import { rescale } from 'src/app/misc/rescale.function';

@Component({
	selector: 'app-block',
	templateUrl: './block.component.html',
	styleUrls: ['./block.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlockComponent implements OnInit {
	public _containerWidth: number;

	@Input()
	public set containerWidth(containerWidth: number) {
		this._containerWidth = containerWidth;
		this.update();
	}

	public get containerWidth(): number {
		return this._containerWidth;
	}

	private _actor: Actor;
	private blockStart: number;
	private blockEnd: number;

	@Input()
	public set actor(actor: Actor) {
		this._actor = actor;
		this.blockStart = this._actor.states.first().key.unix;
		this.blockEnd = this._actor.states.last().key.unix;
		this.update();
	}

	public get actor(): Actor {
		return this._actor;
	}

	public _frameStart: number;

	@Input()
	public set frameStart(frameStart: number) {
		this._frameStart = frameStart;
		this.update();
	}

	public get frameStart(): number {
		return this._frameStart;
	}

	public _frameEnd: number;

	@Input()
	public set frameEnd(frameEnd: number) {
		this._frameEnd = frameEnd;
		this.update();
	}

	public get frameEnd(): number {
		return this._frameEnd;
	}

	@HostBinding('style.left.px')
	public left: number;

	@HostBinding('style.width.px')
	public width: number;

	private update(): void {
		if (
			this.blockStart !== undefined &&
			this.blockEnd !== undefined &&
			this.frameStart !== undefined &&
			this.frameEnd !== undefined &&
			this.containerWidth !== undefined
		) {
			this.left = rescale(this.blockStart, this.frameStart, this.frameEnd, 0, this.containerWidth);
			const right = rescale(this.blockEnd, this.frameStart, this.frameEnd, 0, this.containerWidth);
			this.width = right - this.left;
		}
		this.cd.detectChanges();
	}

	public nodePosition(unix: number): number {
		return rescale(unix, this.blockStart, this.blockEnd, 0, this.width);
	}

	constructor(private cd: ChangeDetectorRef) {}
	ngOnInit() {}
}

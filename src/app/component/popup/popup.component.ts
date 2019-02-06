import { Component, OnInit, EventEmitter, Output, Input, HostBinding, HostListener } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { EventListener } from '@angular/core/src/debug/debug_node';
import { Vector3 } from 'three';
@Component({
	selector: 'app-popup',
	templateUrl: './popup.component.html',
	styleUrls: ['./popup.component.scss'],
	animations: [
		trigger('open', [
			state('hidden', style({ backgroundColor: '#FFFFFA' })),
			state('visible', style({ backgroundColor: '#FFFF13' })),
			transition('* <=> open', [animate('0.15s ease-in')])
		])
	]
})
export class PopupComponent implements OnInit {
	@Output()
	openChange = new EventEmitter<boolean>();

	_open = true;

	@Input()
	@HostBinding('style.top.px')
	top: number;

	@Input()
	@HostBinding('style.left.px')
	left: number;

	@Input()
	set pos(vector: Vector3) {
		this.left = vector ? vector.x : 0;
		this.top = vector ? vector.y : 0;
	}

	get pos(): Vector3 {
		return new Vector3(this.left, this.top);
	}

	@Input()
	set open(open: boolean) {
		this._open = open;
		this.openChange.emit(this.open);
	}

	get open(): boolean {
		return this._open;
	}
	constructor() {}

	ngOnInit() {}
}

import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { EventListener } from '@angular/core/src/debug/debug_node';
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

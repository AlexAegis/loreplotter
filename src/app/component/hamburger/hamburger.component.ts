import { Component, OnInit, Input, EventEmitter, Output, HostListener, HostBinding } from '@angular/core';
import { transition, animate, query, trigger, animateChild } from '@angular/animations';

@Component({
	selector: 'app-hamburger',
	templateUrl: './hamburger.component.html',
	styleUrls: ['./hamburger.component.scss']
})
export class HamburgerComponent implements OnInit {
	constructor() {}

	@Output() openChange = new EventEmitter<boolean>();

	private _open: boolean;

	set open(open: boolean) {
		this._open = open;
		this.openChange.emit(this.open);
	}

	@Input()
	get open(): boolean {
		return this._open;
	}

	ngOnInit() {}

	@HostListener('click', ['$event'])
	toggle(event): void {
		this.open = !this.open;
	}
}

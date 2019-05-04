import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';

@Component({
	selector: 'app-hamburger',
	templateUrl: './hamburger.component.html',
	styleUrls: ['./hamburger.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HamburgerComponent implements OnInit {
	public constructor() {}

	@Output() openChange = new EventEmitter<boolean>();

	private _open: boolean;

	public set open(open: boolean) {
		this._open = open;
		this.openChange.emit(this.open);
	}

	@Input()
	public get open(): boolean {
		return this._open;
	}

	public ngOnInit(): void {}

	@HostListener('click', ['$event'])
	public toggle(event): void {
		this.open = !this.open;
	}
}

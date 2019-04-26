import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DeltaProperty } from 'src/app/model/delta-property.class';

@Component({
	selector: 'app-slider',
	templateUrl: './slider.component.html',
	styleUrls: ['./slider.component.scss']
})
export class SliderComponent implements OnInit {
	@Input()
	public min: number;

	@Input()
	public max: number;

	private _value = new DeltaProperty();

	@Output()
	public valueChange = new EventEmitter<number>(true);

	public set value(value: number) {
		console.log(`set val: ${value}`);
		this._value.base = value;
		this.valueChange.emit(this._value.base);
	}

	@Input()
	public get value(): number {
		console.log(`get val: ${this._value.total}`);
		return this._value.total;
	}

	constructor() {}

	ngOnInit() {}
}

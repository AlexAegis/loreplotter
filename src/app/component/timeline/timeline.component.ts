import { Component, OnInit, HostListener } from '@angular/core';
import * as moment from 'moment';
import { Moment } from 'moment';

@Component({
	selector: 'app-timeline',
	templateUrl: './timeline.component.html',
	styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit {
	beginning: Moment;
	frame: Moment;
	unitsBetween: number;

	constructor() {
		this.frame = moment(0);
		this.frame.set('months', 1);
		this.beginning = moment(0);
		this.unitsBetween = this.calcUnitsBetween();
	}

	@HostListener('mousewheel', ['$event'])
	scrollHandler($event: WheelEvent) {
		console.log($event);
		if ((this.unitsBetween > 5 && $event.deltaY < 0) || ($event.deltaY > 0 && this.unitsBetween < 31)) {
			this.frame.add(this.normalize($event.deltaY), 'day');
			this.beginning.subtract(this.normalize($event.deltaY), 'day');
			this.unitsBetween = this.calcUnitsBetween();
		}
	}

	calcUnitsBetween(): number {
		return this.frame.diff(this.beginning, 'day');
	}

	ngOnInit() {}

	normalize(value: number) {
		return value / Math.abs(value);
	}
}

import { MediaObserver } from '@angular/flex-layout';
import { Component, OnInit, HostListener, HostBinding, AfterViewInit, Input, ElementRef } from '@angular/core';
import * as moment from 'moment';
import { Moment } from 'moment';
import { mixinTabIndex } from '@angular/material';
import ResizeObserver from 'resize-observer-polyfill';
import * as THREE from 'three';

@Component({
	selector: 'app-timeline',
	templateUrl: './timeline.component.html',
	styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent implements OnInit, AfterViewInit {
	constructor(public el: ElementRef) {
		this.frame = moment(0);
		this.frame.set('months', 1);
		this.beginning = moment(0);
		this.calcUnitsBetween();
	}
	beginning: Moment;
	frame: Moment;
	unitsBetween: number;
	distanceBetweenUnits: number;
	distanceBetweenUnitsStyle: string;
	width: number;
	unit: moment.unitOfTime.DurationConstructor = 'day';
	offset = 0;

	dist(i: number) {
		return (i === 0 ? 4 : 0) + this.offset + this.distanceBetweenUnits * i + 'px';
	}

	ngAfterViewInit(): void {
		// ResizeObserver is not really supportod outside of chrome.
		// It can also make the app crash on MacOS https://github.com/que-etc/resize-observer-polyfill/issues/36
		const resize$ = new ResizeObserver(e => {
			e.forEach(change => {
				this.width = change.contentRect.width;
				this.calcUnitsBetween();
			});
		});
		resize$.observe(this.el.nativeElement);
	}

	/**
	 * Idea is to when reach the bottom border, then scale down, and when reaching
	 * the upper boundary, raise the scale
	 * (Cant go up of days? go weeks, then months etc)
	 * @param $event mouseEvent
	 */
	@HostListener('mousewheel', ['$event'])
	scrollHandler($event: WheelEvent) {
		console.log($event);
		if ((this.unitsBetween > 5 && $event.deltaY < 0) || ($event.deltaY > 0 && this.unitsBetween < 31)) {
			this.frame.add(this.normalize($event.deltaY), this.unit);
			this.beginning.subtract(this.normalize($event.deltaY), this.unit);
			this.calcUnitsBetween();
		}
	}

	calcUnitsBetween(): void {
		this.unitsBetween = this.frame.diff(this.beginning, this.unit);
		this.distanceBetweenUnits = (this.width - this.unitsBetween * 4) / (this.unitsBetween + 1);
		this.distanceBetweenUnitsStyle = this.distanceBetweenUnits + 'px';
	}

	shift($event: any) {
		const sum = this.offset + THREE.Math.clamp($event.velocityX, -3, 3) * 10;
		const whole = sum / this.distanceBetweenUnits;
		this.offset = sum;
		console.log(`pos: ${this.offset} sum: ${sum}, whole: ${whole}`);

		if (whole > 1) {
			this.beginning.add(1, this.unit);
			// console.log(`FRAMESHIFT +1`);
			this.offset = sum - this.distanceBetweenUnits;
		}

		if (whole < 0) {
			this.beginning.add(-1, this.unit);
			// console.log(`FRAMESHIFT -1`);
			this.offset = sum + this.distanceBetweenUnits;
		}

		// this.pos = sum % this.distanceBetweenUnits;
	}

	ngOnInit() {}

	normalize(value: number) {
		return value / Math.abs(value);
	}
}

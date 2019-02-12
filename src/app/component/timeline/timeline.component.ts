import { MediaObserver } from '@angular/flex-layout';
import { Component, OnInit, HostListener, HostBinding, AfterViewInit, Input, ElementRef } from '@angular/core';
import * as moment from 'moment';
import { Moment } from 'moment';
import { mixinTabIndex } from '@angular/material';
import ResizeObserver from 'resize-observer-polyfill';

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

	dist(i: number) {
		return this.distanceBetweenUnits * (i + 1) + 'px';
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
			this.frame.add(this.normalize($event.deltaY), 'day');
			this.beginning.subtract(this.normalize($event.deltaY), 'day');
			this.calcUnitsBetween();
		}
	}

	calcUnitsBetween(): void {
		this.unitsBetween = this.frame.diff(this.beginning, 'day');
		this.distanceBetweenUnits = (this.width - this.unitsBetween * 4) / this.unitsBetween;
		this.distanceBetweenUnitsStyle = this.distanceBetweenUnits + 'px';
	}

	ngOnInit() {}

	normalize(value: number) {
		return value / Math.abs(value);
	}
}

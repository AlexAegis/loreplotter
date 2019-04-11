import { Component, OnInit, EventEmitter, Output, Input, HostBinding, HostListener } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { EventListener } from '@angular/core/src/debug/debug_node';
import { Vector3, Vector2 } from 'three';
@Component({
	selector: 'app-popup',
	templateUrl: './popup.component.html',
	styleUrls: ['./popup.component.scss'],
	animations: [
		trigger('visibility', [
			state('hidden', style({ transform: 'scale(0)', transformOrigin: '0% 20%', opacity: '0.4' })),
			state('visible', style({ transform: 'scale(1)', transformOrigin: '0% 20%', opacity: '1' })),
			transition('hidden => visible', [animate('0.3s cubic-bezier(.56,2.05,.11,.61)')]),
			transition('visible => hidden', [animate('0.3s cubic-bezier(.11,1.07,0,1.01)')])
		])
	]
})
export class PopupComponent implements OnInit {
	@Input()
	@HostBinding('style.top.px')
	top: number;

	@Input()
	@HostBinding('style.left.px')
	left: number;

	// @Input()
	// @HostBinding('style.visibility')
	visibility = 'hidden';

	@Input()
	set pos(vector: Vector2) {
		this.left = vector ? vector.x : this.left;
		this.top = vector ? vector.y : this.top;
		if (vector) {
			this.visibility = 'visible';
		} else {
			this.visibility = 'hidden';
		}
	}

	get pos(): Vector2 {
		return new Vector2(this.left, this.top);
	}

	constructor() {}

	ngOnInit() {}
}

import { Component, OnInit } from '@angular/core';
import { EngineService } from 'src/app/engine/engine.service';
import { trigger, state, transition, style, animate } from '@angular/animations';

@Component({
	selector: 'app-light-control',
	templateUrl: './light-control.component.html',
	styleUrls: ['./light-control.component.scss'],
	animations: [
		trigger('toggles', [
			transition(':enter', [
				style({ transform: 'translateX(-100%)', opacity: 0 }), // initial
				animate('0.5s cubic-bezier(.4,.71,0,1)', style({ transform: 'translateX(0%)', opacity: 1 })) // final
			]),
			transition(':leave', [
				style({ transform: 'translateX(0%)', opacity: 1 }), // initial
				animate('0.5s cubic-bezier(.4,.71,0,1)', style({ transform: 'translateX(-100%)', opacity: 0 })) // final
			])
		])
	]
})
export class LightControlComponent implements OnInit {
	constructor(public engineService: EngineService) {}

	ngOnInit() {}

	public togglePermaDay() {
		this.engineService.permamentDay.next(!this.engineService.permamentDay.value);
	}

	public permaDay() {
		this.engineService.permamentDay.next(true);
	}

	public permaNight() {
		this.engineService.permamentDay.next(false);
	}

	public toggleManualLight() {
		this.engineService.manualLightControl.next(!this.engineService.manualLightControl.value);
	}
}

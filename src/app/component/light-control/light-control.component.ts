import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EngineService } from 'src/app/engine/engine.service';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { faMoon, faSun, IconDefinition } from '@fortawesome/free-solid-svg-icons';
@Component({
	selector: 'app-light-control',
	templateUrl: './light-control.component.html',
	styleUrls: ['./light-control.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
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
	constructor(public engineService: EngineService, private cd: ChangeDetectorRef) {}

	public faMoon = faMoon;
	public faSun = faSun;

	ngOnInit() {}

	public togglePermaDay($event: any) {
		this.engineService.manualLight.next(!this.engineService.manualLight.value);
		this.cd.detectChanges();
		this.cd.markForCheck();
	}

	public toggleManualLight($event: any) {
		this.engineService.manualLightControl.next(!this.engineService.manualLightControl.value);
		this.cd.detectChanges();
		this.cd.markForCheck();
	}

	public get toggleIcon(): IconDefinition {
		return this.engineService.manualLight.value ? this.faSun : this.faMoon;
	}
}

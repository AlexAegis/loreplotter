import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { EngineService } from '@app/lore/engine/engine.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { faMoon, faSun, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Observable } from 'rxjs';

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
	public manualLightAlwaysOn$: Observable<boolean>;
	public autoLight$: Observable<boolean>;

	constructor(public storeFacade: StoreFacade, private cd: ChangeDetectorRef) {
		this.manualLightAlwaysOn$ = this.storeFacade.manualLightAlwaysOn$;
		this.autoLight$ = this.storeFacade.autoLight$;
	}

	public faMoon = faMoon;
	public faSun = faSun;

	ngOnInit() {}

	public toggleManualLightAlwaysOn($event: any) {
		$event.preventDefault();
		this.storeFacade.toggleManualLightAlwaysOn();
		this.cd.detectChanges();
		this.cd.markForCheck();
	}

	public toggleAutoLight($event: any) {
		$event.preventDefault();
		this.storeFacade.toggleAutoLight();
		this.cd.detectChanges();
		this.cd.markForCheck();
	}

}

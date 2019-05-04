import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
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
	public manualLight$: Observable<boolean>;

	public constructor(public storeFacade: StoreFacade, private cd: ChangeDetectorRef) {
		this.manualLightAlwaysOn$ = this.storeFacade.manualLightAlwaysOn$;
		this.manualLight$ = this.storeFacade.manualLight$;
	}

	public faMoon = faMoon;
	public faSun = faSun;

	public ngOnInit(): void {}

	public toggleManualLightAlwaysOn($event: any): void {
		$event.preventDefault();
		this.storeFacade.toggleManualLightAlwaysOn();
		this.cd.detectChanges();
		this.cd.markForCheck();
	}

	public toggleAutoLight($event: any): void {
		$event.preventDefault();
		this.storeFacade.toggleAutoLight();
		this.cd.detectChanges();
		this.cd.markForCheck();
	}
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Options } from 'ng5-slider';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
	selector: 'app-speed-control',
	templateUrl: './speed-control.component.html',
	styleUrls: ['./speed-control.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SpeedControlComponent implements OnInit {
	public speed$: Observable<number>;

	public sliderOptions: Options = {
		floor: -6400,
		ceil: 6400
	};

	public constructor(private storeFacade: StoreFacade, private changeDetector: ChangeDetectorRef) {
		this.speed$ = this.storeFacade.playSpeed$.pipe(tap(() => this.changeDetector.detectChanges()));
	}

	public ngOnInit(): void {}

	public setSpeed(speed: number, retainDirection: boolean = true): void {
		this.storeFacade.setPlaySpeed(speed, retainDirection);
	}

	public changeDirection(): void {
		this.storeFacade.changePlayDirection();
	}
}

import { Component, OnInit } from '@angular/core';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Observable } from 'rxjs';
import { Options } from 'ng5-slider';

@Component({
	selector: 'app-speed-control',
	templateUrl: './speed-control.component.html',
	styleUrls: ['./speed-control.component.scss']
})
export class SpeedControlComponent implements OnInit {
	public speed$: Observable<number>;

	public sliderOptions: Options = {
		floor: -6400,
		ceil: 6400
	};

	constructor(private storeFacade: StoreFacade) {
		this.speed$ = this.storeFacade.playSpeed$;
	}

	ngOnInit() {}

	public setSpeed(speed: number) {
		this.storeFacade.setPlaySpeed(speed);
	}
}

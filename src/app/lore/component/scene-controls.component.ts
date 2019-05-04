
import { Component, OnInit } from '@angular/core';
import { Options } from 'ng5-slider';
import {
	faArrowsAlt,
	faPencilAlt,
} from '@fortawesome/free-solid-svg-icons';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Observable } from 'rxjs';
import { InteractionMode } from '@lore/store/reducers';

@Component({
	selector: 'app-scene-controls',
	templateUrl: './scene-controls.component.html',
	styleUrls: ['./scene-controls.component.scss']
})
export class SceneControlsComponent implements OnInit {

	public interactionMode$: Observable<InteractionMode>;
	public drawHeight$: Observable<number>;
	public drawSize$: Observable<number>;

	public moveIcon = faArrowsAlt;
	public drawIcon = faPencilAlt;

	constructor(private storeFacade: StoreFacade) {
		this.interactionMode$ = this.storeFacade.interactionMode$;
		this.drawHeight$ = this.storeFacade.drawHeight$;
		this.drawSize$ = this.storeFacade.drawSize$;
	}

	public iconSize = 'lg';

	public heightSliderOptions: Options = {
		floor: 0,
		step: 0.01,
		ceil: 1
	};

	public sizeSliderOptions: Options = {
		floor: 1,
		step: 0.01,
		ceil: 1000
	};
	ngOnInit() {}

	public setDrawSize(to: number): void {
		this.storeFacade.setDrawSize(to);
	}

	public setDrawHeight(to: number): void {
		this.storeFacade.setDrawHeight(to);
	}

	public setInteractionMode(mode: InteractionMode): void {
		this.storeFacade.setInteractionMode(mode);
	}
}

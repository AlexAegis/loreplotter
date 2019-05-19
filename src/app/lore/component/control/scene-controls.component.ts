import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { faArrowsAlt, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { InteractionMode } from '@lore/store/reducers';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Options } from 'ng5-slider';
import { Observable } from 'rxjs';

@Component({
	selector: 'app-scene-controls',
	templateUrl: './scene-controls.component.html',
	styleUrls: ['./scene-controls.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SceneControlsComponent implements OnInit {
	public interactionMode$: Observable<InteractionMode>;
	public actorObjectSizeBias$: Observable<number>;
	public drawHeight$: Observable<number>;
	public drawSize$: Observable<number>;

	public moveIcon = faArrowsAlt;
	public drawIcon = faPencilAlt;

	public actorObjectSizeBiasOptions: Options = {
		floor: 0.15,
		step: 0.01,
		ceil: 2
	};

	public heightSliderOptions: Options = {
		floor: 0,
		step: 0.01,
		ceil: 1
	};

	public sizeSliderOptions: Options = {
		floor: 1,
		step: 0.01,
		ceil: 1000,
		logScale: true
	};

	public constructor(private storeFacade: StoreFacade) {
		this.interactionMode$ = this.storeFacade.interactionMode$;
		this.actorObjectSizeBias$ = this.storeFacade.actorObjectSizeBias$;
		this.drawHeight$ = this.storeFacade.drawHeight$;
		this.drawSize$ = this.storeFacade.drawSize$;
	}

	public ngOnInit() {}

	public setActorObjectSizeBias(to: number): void {
		this.storeFacade.setActorObjectSizeBias(to);
	}

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

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { StoreFacade } from '@lore/store/store-facade.service';
import { Observable } from 'rxjs';
import { faPause, faPlay, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-play',
	templateUrl: './play.component.html',
	styleUrls: ['./play.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayComponent implements OnInit {
	public isPlaying$: Observable<boolean>;

	public icon: IconDefinition;

	constructor(private storeFacade: StoreFacade, private changeDetector: ChangeDetectorRef) {
		this.isPlaying$ = this.storeFacade.isPlaying$;
	}

	public ngOnInit() {
		this.isPlaying$.subscribe(isPlaying => {
			this.icon = isPlaying ? faPause : faPlay;
			this.changeDetector.markForCheck();
		});
	}

	public togglePlay(): void {
		this.storeFacade.togglePlay();
	}
}

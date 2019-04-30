import { AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Router, Event, ChildActivationEnd } from '@angular/router';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
	private loaded: boolean;

	public constructor(private router: Router) {
		this.loaded = false;
		this.router.events.pipe().subscribe((event: Event) => {
			if (event instanceof ChildActivationEnd) {
				this.loaded = true;
			}
		});
	}

	public title = 'Lore';

	ngAfterViewInit(): void {}

	ngOnDestroy(): void {}

	ngOnInit(): void {}
}

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ChildActivationEnd, Event, Router } from '@angular/router';
import { BaseDirective } from '@app/component/base-component.class';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent extends BaseDirective implements OnInit {
	public title = 'Lore';
	public loaded: boolean;
	public constructor(private router: Router) {
		super();
		this.loaded = false;
		this.teardown(
			this.router.events.pipe().subscribe((event: Event) => {
				if (event instanceof ChildActivationEnd) {
					this.loaded = true;
				}
			})
		);
	}

	public ngOnInit(): void {}
}

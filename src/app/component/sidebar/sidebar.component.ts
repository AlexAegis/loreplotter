import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

import { MediaChange, MediaObserver } from '@angular/flex-layout';

@Component({
	selector: 'app-sidebar',
	templateUrl: './sidebar.component.html',
	styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
	over = 'side';
	expandHeight = '42px';
	collapseHeight = '42px';
	displayMode = 'flat';

	@Input()
	disabled = false;

	opened = false;

	constructor(private media: MediaObserver) {
		/*this.auth.login$.subscribe(user => {
			if (!user) {
				this.opened = false;
			} else if (!media.isActive('sm') && !media.isActive('xs')) {
				this.opened = true;
			}
		});*/
	}

	ngOnInit(): void {
		this.media.media$.subscribe((change: MediaChange) => {
			this.opened = change.mqAlias === 'xl';
			this.over = change.mqAlias === 'xl' ? 'side' : 'over';
		});
	}

	onCloseStart(): void {
		this.opened = false;
	}
}

import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';

import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { faMale } from '@fortawesome/free-solid-svg-icons';
import { flatMap, filter } from 'rxjs/operators';
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
	maleIcon = faMale;
	maleIconSize = 'lg';
	@Input()
	disabled = false;

	opened = false;

	constructor(private media: MediaObserver) {
		this.media
			.asObservable()
			.pipe(filter(a => a && a.length > 0))
			.subscribe((changes: MediaChange[]) => {
				this.opened = changes[0].mqAlias === 'xl';
				this.over = changes[0].mqAlias === 'xl' ? 'side' : 'over';
			});
		/*this.auth.login$.subscribe(user => {
			if (!user) {
				this.opened = false;
			} else if (!media.isActive('sm') && !media.isActive('xs')) {
				this.opened = true;
			}
		});*/
	}

	ngOnInit(): void {
		/*	this.media
		.asObservable()
		.pipe(flatMap(a => a))
		.subscribe((change: MediaChange) => {
			this.opened = change.mqAlias === 'xl';
			this.over = change.mqAlias === 'xl' ? 'side' : 'over';
		});*/
	}

	onCloseStart(): void {
		this.opened = false;
	}
}

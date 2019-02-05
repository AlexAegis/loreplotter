import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
	title = 'asd';

	@ViewChild('container')
	container: ElementRef;

	constructor() {}

	ngAfterViewInit(): void {}
}

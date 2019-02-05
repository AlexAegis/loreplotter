import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import * as TWEEN from '@tweenjs/tween.js';
@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements AfterViewInit {
	title = 'asd';
	globe;

	@ViewChild('container')
	container: ElementRef;

	constructor() {}

	ngAfterViewInit(): void {}
}

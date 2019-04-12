import { Component, OnInit, Input } from '@angular/core';
import { Actor } from 'src/app/model/actor.class';

@Component({
	selector: 'app-block',
	templateUrl: './block.component.html',
	styleUrls: ['./block.component.scss']
})
export class BlockComponent implements OnInit {
	@Input()
	actor: Actor;

	constructor() {}

	ngOnInit() {}
}

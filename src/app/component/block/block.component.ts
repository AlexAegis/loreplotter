import { Component, OnInit, Input } from '@angular/core';
import { Actor } from 'src/app/model/actor.class';

@Component({
	selector: 'app-block',
	templateUrl: './block.component.html',
	styleUrls: ['./block.component.scss']
})
export class BlockComponent implements OnInit {
	@Input()
	public actor: Actor;

	@Input()
	public frameStart: number;

	@Input()
	public frameEnd: number;

	constructor() {}

	ngOnInit() {
		this.actor.states.min(); // node
	}
}

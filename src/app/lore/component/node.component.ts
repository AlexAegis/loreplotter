import { Component, Input, OnInit } from '@angular/core';
import { ActorDelta, UnixWrapper } from '@app/model/data';
import { Node } from '@alexaegis/avl';

@Component({
	selector: 'app-node',
	templateUrl: './node.component.html',
	styleUrls: ['./node.component.scss']
})
export class NodeComponent implements OnInit {
	constructor() {}

	@Input()
	private node: Node<UnixWrapper, ActorDelta>;

	ngOnInit() {}
}

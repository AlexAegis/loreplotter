import { SceneControlService } from './scene-control.service';
import { Component, OnInit, HostBinding } from '@angular/core';

@Component({
	selector: 'app-scene-controls',
	templateUrl: './scene-controls.component.html',
	styleUrls: ['./scene-controls.component.scss']
})
export class SceneControlsComponent implements OnInit {
	constructor(public sceneControlService: SceneControlService) {}

	public iconSize = 'lg';

	ngOnInit() {}
}

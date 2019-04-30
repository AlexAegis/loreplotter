import { SceneControlService } from './scene-control.service';
import { Component, OnInit } from '@angular/core';
import { Options } from 'ng5-slider';

@Component({
	selector: 'app-scene-controls',
	templateUrl: './scene-controls.component.html',
	styleUrls: ['./scene-controls.component.scss']
})
export class SceneControlsComponent implements OnInit {
	constructor(public sceneControlService: SceneControlService) {}

	public iconSize = 'lg';

	public heightSliderOptions: Options = {
		floor: 0,
		step: 0.01,
		ceil: 1
	};

	public sizeSliderOptions: Options = {
		floor: 1,
		step: 0.01,
		ceil: 1000
	};
	ngOnInit() {}
}

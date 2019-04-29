import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

/**
 * Contains the initial data of the dialog
 */
export interface ActorFormComponentData {
	/** Most recent knowledge at the time of opening */
	recentKnowledge: Map<String, String>;
	/** Cursor position at the time of opening the dialog */
	unix: number;
}

@Component({
	selector: 'app-actor-form',
	templateUrl: './actor-form.component.html',
	styleUrls: ['./actor-form.component.scss']
})
export class ActorFormComponent implements OnInit {
	constructor(@Inject(MAT_DIALOG_DATA) public data: ActorFormComponentData) {}

	ngOnInit() {}
}

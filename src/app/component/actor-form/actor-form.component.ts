import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder } from '@angular/forms';
import { ActorObject } from 'src/app/engine/object/actor-object.class';

/**
 * Contains the initial data of the dialog
 */
export interface ActorFormComponentData {
	name: string;
	/** Most recent knowledge at the time of opening */
	knowledge: Array<{ key: String; value: String }>;
	/** Cursor position at the time of opening the dialog */
	selected: ActorObject;
	cursor: number;
}

@Component({
	selector: 'app-actor-form',
	templateUrl: './actor-form.component.html',
	styleUrls: ['./actor-form.component.scss']
})
export class ActorFormComponent implements OnInit {
	focused = true;

	public actorForm = this.formBuilder.group({
		name: this.formBuilder.control(''),
		date: this.formBuilder.control(''),
		knowledge: this.formBuilder.group({})
	});

	constructor(
		@Inject(MAT_DIALOG_DATA) public originalData: ActorFormComponentData,
		private formBuilder: FormBuilder
	) {
		console.log(`dialoge opened with data:`);
		console.log(originalData);
		this.actorForm.controls.name.setValue(this.originalData.name);
	}

	ngOnInit() {}
}

import { Component, OnInit, Inject, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup, FormControl, FormArray } from '@angular/forms';
import { ActorObject } from 'src/app/engine/object/actor-object.class';
import { Moment } from 'moment';
import * as moment from 'moment';
import { faPlus, IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FormEntryComponent } from '../form-entry/form-entry.component';
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
	moment: Moment;
	date: string;
	time: string;
}

@Component({
	selector: 'app-actor-form',
	templateUrl: './actor-form.component.html',
	styleUrls: ['./actor-form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActorFormComponent implements OnInit, AfterViewInit {
	focused = true;
	plusIcon = faPlus;

	public actorForm = this.formBuilder.group({
		name: this.formBuilder.control(''),
		date: this.formBuilder.control(''),
		time: this.formBuilder.control(''),
		knowledge: this.formBuilder.array([]),
		newKnowledge: this.formBuilder.array([])
	});

	public knowledgeArray: FormArray = this.actorForm.controls.knowledge as FormArray;
	public newKnowledgeArray: FormArray = this.actorForm.controls.newKnowledge as FormArray;
	constructor(
		@Inject(MAT_DIALOG_DATA) public originalData: ActorFormComponentData,
		private formBuilder: FormBuilder
	) {
		this.originalData.moment = moment.unix(this.originalData.cursor);
		this.originalData.date = this.originalData.moment.format('YYYY-MM-DD');
		this.originalData.time = this.originalData.moment.format('HH:mm:ss');
	}

	addNewKnowledge($event): void {
		this.newKnowledgeArray.push(FormEntryComponent.create(this.formBuilder));
	}

	get filledNewKnowledgeCount(): number {
		return this.newKnowledgeArray.controls.filter(control => !!(control as FormGroup).controls['key'].value).length;
	}

	get newKnowledgeCount(): number {
		return this.newKnowledgeArray.controls.length - 1;
	}

	ngOnInit() {}

	ngAfterViewInit() {}
}

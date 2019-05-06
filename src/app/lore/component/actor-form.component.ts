import { AfterViewInit, ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material';
import { ActorObject } from '@app/lore/engine/object/actor-object.class';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import moment, { Moment } from 'moment';
import { FormEntryComponent } from './form-entry.component';

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
	maxSpeed: number;
	moment: Moment;
	date: Moment;
	time: string;
	color: string;
}

export interface ActorFormResultData {
	name: string;
	date: Moment;
	maxSpeed: number;
	knowledge: Array<{ key: String; value: String; forget: boolean }>;
	newKnowledge: Array<{ key: String; value: String }>;
	object: ActorObject;
	color: string;
}

@Component({
	selector: 'app-actor-form',
	templateUrl: './actor-form.component.html',
	styleUrls: ['./actor-form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActorFormComponent implements OnInit, AfterViewInit {
	public plusIcon = faPlus;
	private _color: string;

	public set color(color: string) {
		this._color = color;
	}

	public get color(): string {
		return this._color;
	}

	public actorForm = this.formBuilder.group({
		name: this.formBuilder.control(''),
		date: this.formBuilder.control(''),
		time: this.formBuilder.control(''),
		maxSpeed: this.formBuilder.control(''),
		knowledge: this.formBuilder.array([]),
		newKnowledge: this.formBuilder.array([])
	});

	public knowledgeArray: FormArray = this.actorForm.controls.knowledge as FormArray;
	public newKnowledgeArray: FormArray = this.actorForm.controls.newKnowledge as FormArray;
	public constructor(
		@Inject(MAT_DIALOG_DATA) public originalData: ActorFormComponentData,
		private formBuilder: FormBuilder
	) {
		this.originalData.moment = moment.unix(this.originalData.cursor);
		this.originalData.date = this.originalData.moment;
		this.originalData.time = this.originalData.moment.format('HH:mm:ss');
		this.color = this.originalData.color;
	}

	public addNewKnowledge($event): void {
		this.newKnowledgeArray.push(FormEntryComponent.create(this.formBuilder));
	}

	public get filledNewKnowledgeCount(): number {
		return this.newKnowledgeArray.controls.filter(control => !!(control as FormGroup).controls['key'].value).length;
	}

	public get newKnowledgeCount(): number {
		return this.newKnowledgeArray.controls.length - 1;
	}

	public get result(): ActorFormResultData {
		const maxSpeed = this.actorForm.controls['maxSpeed'].value;
		const time = this.actorForm.controls['time'].value || this.originalData.time;
		const finalDatetime =
			((this.actorForm.controls['date'].value as Moment) || this.originalData.date).format('YYYY-MM-DD') +
			'T' +
			time;
		return {
			date: moment(finalDatetime),
			name: this.actorForm.controls['name'].value,
			maxSpeed: maxSpeed ? parseFloat(maxSpeed) : undefined,
			knowledge: this.actorForm.controls['knowledge'].value,
			newKnowledge: this.actorForm.controls['newKnowledge'].value,
			object: this.originalData.selected,
			color: this.color
		};
	}

	public ngOnInit() {}

	public ngAfterViewInit() {}
}

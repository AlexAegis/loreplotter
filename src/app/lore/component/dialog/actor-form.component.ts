import { AfterViewInit, ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Actor } from '@app/model/data';
import { Accumulator } from '@app/service';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FormEntryComponent } from '@lore/component/dialog/form-entry.component';
import { ActorObject } from '@lore/engine/object/actor-object.class';
import moment, { Moment } from 'moment';
import { RxDocument } from 'rxdb';

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
	lastUnix: number;
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
	actor: RxDocument<Actor>;
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

	public originalMoment: Moment;
	public originalDate: string;
	public originalTime: string;

	public knowledgeArray: FormArray = this.actorForm.controls.knowledge as FormArray;
	public newKnowledgeArray: FormArray = this.actorForm.controls.newKnowledge as FormArray;

	public constructor(@Inject(MAT_DIALOG_DATA) public originalData: Accumulator, private formBuilder: FormBuilder) {
		this.originalMoment = moment.unix(this.originalData.cursor);
		this.originalDate = this.originalMoment.format('YYYY-MM-DD');
		this.originalTime = this.originalMoment.format('HH:mm:ss');
		if (originalData.accumulator) {
			this.color = this.originalData.accumulator.color
				? this.originalData.accumulator.color.value
				: Actor.DEFAULT_COLOR;

			if (
				originalData.accumulator.name.appearedIn &&
				originalData.accumulator.name.appearedIn.key.unix === originalData.cursor
			) {
				this.actorForm.controls['name'].setValue(originalData.accumulator.name.value);
			}

			if (
				originalData.accumulator.maxSpeed.appearedIn &&
				originalData.accumulator.maxSpeed.appearedIn.key.unix === originalData.cursor
			) {
				this.actorForm.controls['maxSpeed'].setValue(originalData.accumulator.maxSpeed.value);
			}

			originalData.accumulator.properties.forEach(property => {
				if (property.appearedIn && property.appearedIn.key.unix === originalData.cursor) {
					this.addKnowledge(property.value.key as string, property.value.value as string, this.newKnowledgeArray);
				} else {
					this.addKnowledge(property.value.key as string, property.value.value as string, this.knowledgeArray);
				}
			});
		}
	}

	public get result(): ActorFormResultData {
		const maxSpeed = this.actorForm.controls['maxSpeed'].value;
		const time = this.actorForm.controls['time'].value || this.originalTime;
		const finalDatetime =
			((this.actorForm.controls['date'].value as Moment) || this.originalMoment).format('YYYY-MM-DD') +
			'T' +
			time;
		return {
			date: moment(finalDatetime),
			name: this.actorForm.controls['name'].value,
			maxSpeed: maxSpeed ? parseFloat(maxSpeed) : undefined,
			knowledge: this.actorForm.controls['knowledge'].value,
			newKnowledge: this.actorForm.controls['newKnowledge'].value,
			actor: this.originalData.actor,
			color: this.color
		};
	}

	public addKnowledge(key?: string, value?: string, to?: FormArray): FormGroup {
		const control = FormEntryComponent.create(this.formBuilder);
		if (key) {
			control.controls['key'].setValue(key);
		}
		if (value) {
			control.controls['value'].setValue(value);
		}
		if (to) {
			to.push(control);
		}
		return control;
	}

	public addNewKnowledge(): FormGroup {
		return this.addKnowledge(undefined, undefined, this.newKnowledgeArray);
	}

	public get filledNewKnowledgeCount(): number {
		return this.newKnowledgeArray.controls.filter(control => !!(control as FormGroup).controls['key'].value).length;
	}

	public get newKnowledgeCount(): number {
		return this.newKnowledgeArray.controls.length - 1;
	}

	public ngOnInit() {}

	public ngAfterViewInit() {}
}

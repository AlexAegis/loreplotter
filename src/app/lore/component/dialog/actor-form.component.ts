import { AfterViewInit, ChangeDetectionStrategy, Component, HostListener, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { Actor, UnixWrapper } from '@app/model/data';
import { Accumulator, ActorService } from '@app/service';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FormEntryComponent } from '@lore/component/dialog/form-entry.component';
import { EngineService } from '@lore/engine';
import { ActorObject } from '@lore/engine/object/actor-object.class';
import moment, { Moment } from 'moment';
import { RxDocument } from 'rxdb';

/**
 * Contains the initial data of the dialog
 */
export interface ActorFormComponentData {
	name: string;
	/** Most recent properties at the time of opening */
	properties: Array<{ key: string; value: string }>;
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
	properties: Array<{ key: string; value: string; forget: boolean }>;
	newProperties: Array<{ key: string; value: string }>;
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
	public actorForm = this.formBuilder.group({
		name: this.formBuilder.control(''),
		date: this.formBuilder.control(''),
		time: this.formBuilder.control(''),
		maxSpeed: this.formBuilder.control('', [ctrl => (this.canDo(ctrl.value) ? undefined : { slow: true })]),
		properties: this.formBuilder.array([]),
		newProperties: this.formBuilder.array([])
	});

	public set color(color: string) {
		this._color = color;
	}

	public get color(): string {
		return this._color;
	}

	private afterViewInit: boolean;

	public originalMoment: Moment;
	public originalDate: string;
	public originalTime: string;

	public properties: FormArray = this.actorForm.controls.properties as FormArray;
	public newProperties: FormArray = this.actorForm.controls.newProperties as FormArray;

	public constructor(
		public dialogRef: MatDialogRef<ActorFormComponent>,
		@Inject(MAT_DIALOG_DATA) public originalData: Accumulator,
		private formBuilder: FormBuilder,
		private actorService: ActorService,
		private engineService: EngineService
	) {
		this.originalMoment = moment.unix(this.originalData.cursor);
		this.originalDate = this.originalMoment.format('YYYY-MM-DD');
		this.originalTime = this.originalMoment.format('HH:mm:ss');
		if (originalData.accumulator) {
			this.color = this.originalData.accumulator.color && this.originalData.accumulator.color.value;

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
					this.addProperty(
						property.value.key as string,
						property.value.value as string,
						property.value.value as string,
						this.newProperties
					);
				} else {
					if (property.value.value) {
						this.addProperty(
							property.value.key as string,
							undefined,
							property.value.value as string,
							this.properties
						);
					}
				}
			});
		}
	}

	public get result(): ActorFormResultData {
		const maxSpeed = this.actorForm.controls['maxSpeed'].value;
		const finalDatetime = this.finalTime();
		return {
			date: moment(finalDatetime),
			name: this.actorForm.controls['name'].value,
			maxSpeed: maxSpeed ? parseFloat(maxSpeed) : undefined,
			properties: this.actorForm.controls['properties'].value,
			newProperties: this.actorForm.controls['newProperties'].value,
			actor: this.originalData.actor,
			color: this.color
		};
	}

	public canDo(speed: number): boolean {
		if (this.afterViewInit && speed !== undefined) {
			const unix = moment(this.finalTime()).unix() + 1;
			const enclosing = this.originalData.actor._states.enclosingNodes(
				new UnixWrapper(unix) // (unix === this.originalData.cursor ? 1 : 0)
			);
			let canDo = true;
			if (enclosing.last) {
				const finalPosition = this.actorService.actorPositionAt(this.originalData.actor, unix);
				const reachInTime = this.engineService.canReach(
					finalPosition,
					enclosing.last.value.position,
					speed,
					Math.abs(enclosing.last.key.unix - unix)
				);
				canDo = reachInTime === undefined;
			}
			return canDo;
		} else {
			return true;
		}
	}

	public ngAfterViewInit() {
		this.afterViewInit = true;
	}

	public addProperty(key?: string, value?: string, valuePlaceholder?: string, to?: FormArray): FormGroup {
		const control = FormEntryComponent.create(this.formBuilder);
		if (key) {
			control.controls['key'].setValue(key);
		}
		if (value) {
			control.controls['value'].setValue(value);
		}
		if (valuePlaceholder) {
			control.controls['valuePlaceholder'].setValue(valuePlaceholder);
		}
		if (to) {
			to.push(control);
		}
		return control;
	}

	public addNewProperty(): FormGroup {
		return this.addProperty(undefined, undefined, undefined, this.newProperties);
	}

	public get filledNewPropertyCount(): number {
		return this.newProperties.controls.filter(control => !!(control as FormGroup).controls['key'].value).length;
	}

	public get newPropertyCount(): number {
		return this.newProperties.controls.length - 1;
	}

	@HostListener('keydown', ['$event'])
	public onKeyDown($event: KeyboardEvent): void {
		if ($event.key === 'Enter') {
			$event.preventDefault();
			if (this.actorForm.valid) {
				this.dialogRef.close(this.result);
			}
		}
	}

	public ngOnInit() {}

	private finalTime(): string {
		if (this.afterViewInit) {
			const time = this.actorForm.controls['time'].value || this.originalTime;
			return (
				((this.actorForm.controls['date'].value as Moment) || this.originalMoment).format('YYYY-MM-DD') +
				'T' +
				time
			);
		} else {
			return undefined;
		}
	}
}

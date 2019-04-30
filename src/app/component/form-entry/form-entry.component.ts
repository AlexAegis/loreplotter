import { Component, OnInit, Input, AfterViewInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { faCommentSlash, faTimes, IconDefinition } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-form-entry',
	templateUrl: './form-entry.component.html',
	styleUrls: ['./form-entry.component.scss']
})
export class FormEntryComponent implements OnInit, AfterViewInit {
	@Input()
	parent: FormArray;

	@Input()
	index: number;

	@Input()
	existing: { key: String; value: String };

	@Input()
	control: FormGroup;

	forgetIcon = faCommentSlash;
	removeIcon = faTimes;

	private hiddenValue: any;

	static create(formBuilder: FormBuilder): FormGroup {
		return formBuilder.group({
			key: ['', [Validators.required]],
			value: ['']
		});
	}

	changeForget($event) {
		this.control.controls['forget'].setValue(!(this.control.controls['forget'] as FormControl).value);
		if ((this.control.controls['forget'] as FormControl).value) {
			this.hiddenValue = (this.control.controls['value'] as FormControl).value;
			(this.control.controls['value'] as FormControl).setValue(undefined);
			(this.control.controls['value'] as FormControl).disable();
		} else {
			(this.control.controls['value'] as FormControl).setValue(this.hiddenValue);
			(this.control.controls['value'] as FormControl).enable();
			this.hiddenValue = undefined;
		}
	}

	constructor(private formBuilder: FormBuilder) {}

	remove($event) {
		this.parent.removeAt(this.index);
	}

	ngOnInit() {
		if (!this.control) {
			this.control = FormEntryComponent.create(this.formBuilder);
			this.parent.push(this.control);
		}
		if (this.existing) {
			this.control.controls['key'].setValue(this.existing.key);
			this.control.addControl('forget', this.formBuilder.control(''));
			this.control.controls['forget'].setValue(false);
		}
	}

	ngAfterViewInit() {}
}

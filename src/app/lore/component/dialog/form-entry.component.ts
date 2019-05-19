import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { faCommentSlash, faTimes } from '@fortawesome/free-solid-svg-icons';

@Component({
	selector: 'app-form-entry',
	templateUrl: './form-entry.component.html',
	styleUrls: ['./form-entry.component.scss']
})
export class FormEntryComponent implements OnInit, AfterViewInit {
	@Input()
	public parent: FormArray;

	@Input()
	public index: number;

	@Input()
	public existing: boolean;

	@Input()
	public control: FormGroup;

	public forgetIcon = faCommentSlash;
	public removeIcon = faTimes;

	private hiddenValue: any;

	public originalKey: string;
	public originalValue: string;

	public static create(formBuilder: FormBuilder): FormGroup {
		return formBuilder.group({
			key: ['', [Validators.required]],
			value: [''],
			forget: [''],
			valuePlaceholder: ['']
		});
	}

	public changeForget($event): void {
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

	public constructor(private formBuilder: FormBuilder) {}

	public remove($event): void {
		this.parent.removeAt(this.index);
	}

	public ngOnInit(): void {

		if (!this.control) {
			this.control = FormEntryComponent.create(this.formBuilder);
			this.parent.push(this.control);
		}
		if (this.existing) {
			this.originalKey = this.control.controls['key'].value;
			this.originalValue = this.control.controls['value'].value;
		}
		this.originalValue = (this.control.controls['valuePlaceholder'] as FormControl).value;
	}

	public ngAfterViewInit(): void {}
}

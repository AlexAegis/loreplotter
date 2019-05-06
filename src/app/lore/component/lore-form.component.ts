import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material';
import { Lore } from '@app/model/data';

@Component({
	selector: 'app-lore-form',
	templateUrl: './lore-form.component.html',
	styleUrls: ['./lore-form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoreFormComponent implements OnInit {
	public loreForm = this.formBuilder.group({
		id: this.formBuilder.control(''),
		name: this.formBuilder.control(''),
		planet: this.formBuilder.group({
			name: this.formBuilder.control(''),
			radius: this.formBuilder.control(''),
		}),
	});

	constructor(
		@Inject(MAT_DIALOG_DATA) public originalData: Lore,
		private formBuilder: FormBuilder
	) {
		this.loreForm.controls['id'].setValue(originalData.id);
		this.loreForm.controls['name'].setValue(originalData.name);
		(this.loreForm.controls['planet'] as FormGroup).controls['name'].setValue(originalData.planet.name);
		(this.loreForm.controls['planet'] as FormGroup).controls['radius'].setValue(originalData.planet.radius);
	}

	ngOnInit() {}
}

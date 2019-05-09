import { ChangeDetectionStrategy, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validator, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { BaseDirective } from '@app/component/base-component.class';
import { Lore, Planet } from '@app/model/data';
import { DatabaseService } from '@app/service';
import { ConfirmComponent, ConfirmData } from '@lore/component/dialog/confirm.component';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDocument } from 'rxdb';
import { combineLatest, from, iif, of } from 'rxjs';
import { endWith, filter, finalize, flatMap, map, mapTo, mergeMap, switchMap, take, tap } from 'rxjs/operators';

@Component({
	selector: 'app-lore-form',
	templateUrl: './lore-form.component.html',
	styleUrls: ['./lore-form.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoreFormComponent extends BaseDirective implements OnInit {
	public loreForm = this.formBuilder.group({
		id: this.formBuilder.control(''),
		name: this.formBuilder.control(
			'',
			[Validators.required],
			[
				ctrl => {
					return this.storeFacade.lores$.pipe(
						take(1),
						flatMap(lores => lores),
						filter(lore => lore.name === ctrl.value && this.loreForm.controls['id'].value !== lore.id),
						map(lore => ({ duplicate: `Name already present` })),
						endWith(of(undefined)),
						take(1),
					);
				}
			]
		),
		planet: this.formBuilder.group({
			name: this.formBuilder.control('', [Validators.required]),
			radius: this.formBuilder.control('', [Validators.required])
		})
	});

	public handleFileInput(file): void {
		console.log(file);
	}

	public constructor(
		@Inject(MAT_DIALOG_DATA) public originalData: Lore,
		private dialogRef: MatDialogRef<LoreFormComponent>,
		private dialog: MatDialog,
		private formBuilder: FormBuilder,
		private databaseService: DatabaseService,
		private storeFacade: StoreFacade
	) {
		super();
		this.loreForm.controls['id'].setValue(originalData.id);
		this.loreForm.controls['name'].setValue(originalData.name);
		(this.loreForm.controls['planet'] as FormGroup).controls['name'].setValue(originalData.planet.name);
		(this.loreForm.controls['planet'] as FormGroup).controls['radius'].setValue(originalData.planet.radius);
	}

	public loadDefaultEarth(): void {
		this.teardown(
			this.dialog
				.open(ConfirmComponent, {
					data: {
						title: 'Warning!',
						message:
							'Are you sure? This will immediately overwrite your current landscape, planet name and planet radius!'
					} as ConfirmData
				})
				.afterClosed()
				.pipe(
					mergeMap(result =>
						iif(
							() => result,
							combineLatest([
								this.databaseService.database$.pipe(
									switchMap(db =>
										db.lore.find({ id: this.originalData.id }).$.pipe(
											flatMap(l => l),
											take(1)
										)
									)
								),
								from(fetch(`assets/elev_bump_8k.jpg`)).pipe(switchMap(p => p.blob()))
							]).pipe(
								switchMap(([lore, image]) =>
									from(
										(lore as RxDocument<Lore>).putAttachment({
											id: 'texture', // string, name of the attachment like 'cat.jpg'
											data: image as Blob, // (string|Blob|Buffer) data of the attachment
											type: 'image/jpeg' // (string) type of the attachment-data like 'image/jpeg'
										})
									)
								),
								tap(o =>
									(this.loreForm.controls['planet'] as FormGroup).controls['name'].setValue(
										Planet.DEFAULT_NAME
									)
								),
								tap(o =>
									(this.loreForm.controls['planet'] as FormGroup).controls['radius'].setValue(
										Planet.DEFAULT_RADIUS
									)
								),
								tap(o => this.dialogRef.close(this.loreForm.value))
							),
							of(false)
						)
					)
				)
				.subscribe()
		);
	}

	public ngOnInit(): void {}
}

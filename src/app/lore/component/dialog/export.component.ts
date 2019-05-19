import { Component, ElementRef, HostListener, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatSnackBar } from '@angular/material';
import { removeKeys } from '@app/function/key-remover.function';
import { DatabaseService, RxCollections } from '@app/service';
import { ConfirmComponent, ConfirmData } from '@lore/component/dialog/confirm.component';
import { StoreFacade } from '@lore/store/store-facade.service';
import { RxDatabase } from 'rxdb';
import { of } from 'rxjs';
import { catchError, filter, flatMap, map, mapTo, mergeMap, switchMap, take, tap } from 'rxjs/operators';

export interface ExportData {
	data: string;
}

@Component({
	selector: 'app-export',
	templateUrl: './export.component.html',
	styleUrls: ['./export.component.scss']
})
export class ExportComponent implements OnInit {
	@ViewChild('textarea')
	private textarea: ElementRef;

	@ViewChild('downloadHelper')
	private downloadHelper: ElementRef;

	constructor(
		@Inject(MAT_DIALOG_DATA) public data: ExportData,
		private snackBar: MatSnackBar,
		private dialog: MatDialog,
		private databaseService: DatabaseService,
		private storeFacade: StoreFacade
	) {
	}

	ngOnInit() {
	}

	public copyToClipboard(): void {
		this.textarea.nativeElement.select();
		document.execCommand('copy');
		this.textarea.nativeElement.setSelectionRange(0, 0);
		this.snackBar.open('Copied to clipboard!', '', {
			duration: 1000
		});
	}

	public importDatabase(): void {
		this.databaseService.database$
			.pipe(
				take(1),
				switchMap(db =>
					this.dialog
						.open(ConfirmComponent, {
							data: {
								title: 'Warning!',
								message:
									'This will delete everything before importing. Are you sure you want to do this?'
							} as ConfirmData
						})
						.afterClosed()
						.pipe(map(result => (result ? db : undefined)))
				),
				filter(db => db !== undefined),
				switchMap(db =>
					db.lore.find().$.pipe(
						take(1),
						flatMap(lores => lores),
						switchMap(lore => lore.remove()),
						mapTo(db)
					)
				),
				switchMap(db =>
					db.actor.find().$.pipe(
						take(1),
						flatMap(actors => actors),
						switchMap(actor => actor.remove()),
						mapTo(db)
					)
				),
				switchMap(db =>
					of(JSON.parse(this.textarea.nativeElement.value)).pipe(
						map(dump => removeKeys(dump, ['_attachments'])),
						switchMap(shimmedDump => db.importDump(shimmedDump)),
						mapTo(db)
					)
				),
				switchMap((db: RxDatabase<RxCollections>) =>
					db.lore.find().$.pipe(
						flatMap(lores => lores),
						take(1),
						tap(lore => this.storeFacade.selectLore(lore.toJSON())),
						mapTo(db)
					)
				),
				catchError(error =>
					this.snackBar
						.open(`Oops, something went wrong: ${error}`, ``, {
							duration: 2000
						})
						.afterDismissed()
				),
				switchMap(dmp =>
					this.snackBar
						.open(`Database imported!`, ``, {
							duration: 2000
						})
						.afterDismissed()
				)
			)
			.subscribe();
	}

	public isValid(): boolean {
		let validJSON = true;
		try {
			JSON.parse(this.textarea.nativeElement.value);
		} catch (e) {
			validJSON = false;
		}
		return this.textarea.nativeElement.value && validJSON;
	}

	public downloadTextures(): void {
		this.databaseService.database$
			.pipe(
				take(1),
				switchMap(db => db.lore.find().$.pipe(take(1))),
				flatMap(lores => lores),
				mergeMap(lore =>
					lore.allAttachments$.pipe(
						take(1),
						map(attachments => ({ attachments, name: lore.name }))
					)
				),
				flatMap(({ attachments, name }) =>
					of(...attachments).pipe(
						switchMap(attachment => attachment.getData()),
						map(blob => ({ blob, name }))
					)
				),
				tap(({ blob, name }) => {
					const url = window.URL.createObjectURL(blob);
					this.downloadHelper.nativeElement.href = url;
					this.downloadHelper.nativeElement.download = `${name}.${blob.type.split(/[/_]/).pop()}`;
					this.downloadHelper.nativeElement.click();
					window.URL.revokeObjectURL(url);
				})
			)
			.subscribe();
	}

	@HostListener('keydown', ['$event'])
	public onKeyDown($event: KeyboardEvent): void {
		if ($event.key === 'Enter') {
			$event.preventDefault();
			if (this.isValid()) {
				this.importDatabase();
			}
		}
	}

}

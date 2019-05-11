import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

export interface ConfirmData {
	title: string;
	message: string;
}

@Component({
	selector: 'app-confirm',
	templateUrl: './confirm.component.html',
	styleUrls: ['./confirm.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmComponent implements OnInit {
	public title: string;
	public message: string;

	public constructor(
		public dialogRef: MatDialogRef<ConfirmComponent>,
		@Inject(MAT_DIALOG_DATA) public data: ConfirmData,
		private cd: ChangeDetectorRef
	) {
		this.title = (data && data.title) || 'Warning';
		this.message = (data && data.message) || 'Are you sure?';
	}

	public ngOnInit(): void {
	}

	public onConfirm(): void {
		//this.cd.markForCheck();
		this.dialogRef.close(true);
	}

	public onDismiss(): void {
		// this.cd.markForCheck();
		this.dialogRef.close(false);
	}
}

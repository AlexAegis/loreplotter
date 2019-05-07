import { SkyhookMultiBackendModule } from '@angular-skyhook/multi-backend';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LogPipe } from '@app/pipe/log.pipe';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ActorFormComponent } from '@lore/component';
import { ConfirmComponent } from '@lore/component/dialog/confirm.component';
import { ExportComponent } from '@lore/component/dialog/export.component';
import { LoreFormComponent } from '@lore/component/dialog/lore-form.component';
import { Ng5SliderModule } from 'ng5-slider';
import { MomentModule } from 'ngx-moment';
import { NgScrollbarModule, SmoothScrollModule } from 'ngx-scrollbar';

const modules = [
	CommonModule,
	FormsModule,
	ReactiveFormsModule,
	NgScrollbarModule,
	Ng5SliderModule,
	SmoothScrollModule,
	MomentModule,
	FontAwesomeModule,
	DragDropModule,
	OverlayModule,
	SkyhookMultiBackendModule
];

/**
 * A shared module between lazy loaded modules. All the common declarations
 * should go here.
 */
@NgModule({
	declarations: [LogPipe],
	imports: [...modules],
	exports: [...modules],
	entryComponents: [ActorFormComponent, LoreFormComponent, ExportComponent, ConfirmComponent]
})
export class SharedModule {}

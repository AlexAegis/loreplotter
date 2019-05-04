import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LogPipe } from '@app/pipe/log.pipe';
import { NgScrollbarModule, SmoothScrollModule } from 'ngx-scrollbar';
import { Ng5SliderModule } from 'ng5-slider';
import { MomentModule } from 'ngx-moment';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { SkyhookMultiBackendModule } from '@angular-skyhook/multi-backend';
import { LoreStoreModule } from '@lore/store';
import { ActorService, DatabaseService, LoreService } from '@app/service';
import { EngineService } from '@lore/engine';
import { BlockService, SceneControlService } from '@lore/service';

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
	exports: [...modules]
})
export class SharedModule {}

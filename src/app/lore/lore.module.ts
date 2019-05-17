import { SkyhookDndModule } from '@angular-skyhook/core';
import { createDefaultMultiBackend } from '@angular-skyhook/multi-backend';
import { NgModule } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { APP_FORMATS } from '@app/core.module';
import { FocusDirective, RepeatDirective } from '@app/directive';
import { VarDirective } from '@app/directive/var.directive';
import { EngineComponent, EngineService } from '@app/lore/engine';
import { MathRoundPipe } from '@app/pipe';
import { ActorService, DatabaseService, LoreService } from '@app/service';
import { MaterialModule, SharedModule } from '@app/shared';
import {
	ActorFormComponent,
	BlockComponent,
	CursorComponent,
	FormEntryComponent,
	HamburgerComponent,
	LightControlComponent,
	PlayComponent,
	PopupComponent,
	SceneControlsComponent,
	SidebarComponent,
	TimelineComponent
} from '@lore/component';
import { LoreRoutingModule } from '@lore/routes/lore-routing.module';
import { BlockService } from '@lore/service';
import { LoreStoreModule } from '@lore/store';
import { ColorPickerModule } from 'ngx-color-picker';
import { NgxMaskModule } from 'ngx-mask';
import { SpeedControlComponent } from 'src/app/lore/component/control/speed-control.component';
import { LoreFormComponent } from 'src/app/lore/component/dialog/lore-form.component';
import { ConfirmComponent } from './component/dialog/confirm.component';
import { ExportComponent } from './component/dialog/export.component';
import { ToolbarComponent } from './component/element/toolbar.component';
import { LoreComponent } from './lore.component';

@NgModule({
	declarations: [
		EngineComponent,
		PopupComponent,
		SidebarComponent,
		HamburgerComponent,
		TimelineComponent,
		CursorComponent,
		BlockComponent,
		PlayComponent,
		SceneControlsComponent,
		LightControlComponent,
		ActorFormComponent,
		FormEntryComponent,
		LoreComponent,
		FocusDirective,
		RepeatDirective,
		VarDirective,
		SpeedControlComponent,
		LoreFormComponent,
		ExportComponent,
		ConfirmComponent,
		ToolbarComponent,
		MathRoundPipe
	],
	imports: [
		LoreStoreModule,
		SharedModule,
		MaterialModule,
		LoreRoutingModule,
		SkyhookDndModule.forRoot({ backendFactory: createDefaultMultiBackend }),
		NgxMaskModule.forRoot({}),
		ColorPickerModule
	],
	providers: [
		LoreService,
		EngineService,
		DatabaseService,
		ActorService,
		BlockService,
		{ provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
		{ provide: MAT_DATE_FORMATS, useValue: APP_FORMATS }
	]
})
export class LoreModule {}

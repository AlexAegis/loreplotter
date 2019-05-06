import { SkyhookDndModule } from '@angular-skyhook/core';
import { createDefaultMultiBackend } from '@angular-skyhook/multi-backend';
import { NgModule } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { APP_FORMATS } from '@app/core.module';
import { FocusDirective, RepeatDirective } from '@app/directive';
import { EngineComponent, EngineService } from '@app/lore/engine';
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
import { LoreFormComponent } from './component/lore-form.component';
import { SpeedControlComponent } from './component/speed-control.component';
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
		SpeedControlComponent,
		LoreFormComponent
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
	entryComponents: [ActorFormComponent, LoreFormComponent],
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

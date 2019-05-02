import { SkyhookDndModule } from '@angular-skyhook/core';
import { createDefaultMultiBackend } from '@angular-skyhook/multi-backend';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { EngineComponent } from '@app/lore/engine';
import { MaterialModule, SharedModule } from '@app/shared';
import { LoreRoutingModule } from '@lore/routes/lore-routing.module';
import {
	ActorFormComponent,
	FormEntryComponent,
	PlayComponent,
	ListComponent,
	PopupComponent,
	SceneControlsComponent,
	TimelineComponent,
	SidebarComponent,
	BlockComponent,
	CursorComponent,
	HamburgerComponent,
	LightControlComponent
} from '@lore/component';
import { FocusDirective, RepeatDirective } from '@app/directive';
import { NgxMaskModule } from 'ngx-mask';
import { LoreComponent } from './lore.component';
import { DatabaseService } from '@app/service';
import { SpeedControlComponent } from './component/speed-control.component';
import { LoreStoreModule } from '@lore/store';

export const APP_FORMATS = {
	parse: {
		dateInput: 'LL'
	},
	display: {
		dateInput: 'YYYY-MM-DD',
		monthYearLabel: 'YYYY',
		dateA11yLabel: 'LL',
		monthYearA11yLabel: 'YYYY'
	}
};

@NgModule({
	declarations: [
		EngineComponent,
		PopupComponent,
		SidebarComponent,
		HamburgerComponent,
		TimelineComponent,
		ListComponent,
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
		SpeedControlComponent
	],
	imports: [
		SharedModule,
		MaterialModule,
		LoreRoutingModule,
		SkyhookDndModule.forRoot({ backendFactory: createDefaultMultiBackend }),
		NgxMaskModule.forRoot({})
	],
	entryComponents: [ActorFormComponent],
	providers: [

	]
})
export class LoreModule {}

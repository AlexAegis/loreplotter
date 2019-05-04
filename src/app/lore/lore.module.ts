import { SkyhookDndModule } from '@angular-skyhook/core';
import { createDefaultMultiBackend } from '@angular-skyhook/multi-backend';
import { NgModule } from '@angular/core';
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
import { NgxMaskModule } from 'ngx-mask';
import { SpeedControlComponent } from './component/speed-control.component';
import { LoreComponent } from './lore.component';

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
		LoreStoreModule,
		SharedModule,
		MaterialModule,
		LoreRoutingModule,
		SkyhookDndModule.forRoot({ backendFactory: createDefaultMultiBackend }),
		NgxMaskModule.forRoot({})
	],
	entryComponents: [ActorFormComponent],
	providers: [LoreService, EngineService, DatabaseService, ActorService, BlockService]
})
export class LoreModule {}

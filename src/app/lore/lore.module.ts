import { SkyhookDndModule } from '@angular-skyhook/core';
import { createDefaultMultiBackend } from '@angular-skyhook/multi-backend';
import { NgModule } from '@angular/core';
import { BlockComponent } from '@lore/component/block.component';
import { CursorComponent } from '@lore/component/cursor.component';
import { HamburgerComponent } from '@lore/component/hamburger.component';
import { LightControlComponent } from '@lore/component/light-control.component';
import { ListComponent } from '@lore/component/list.component';
import { PlayComponent } from '@lore/component/play.component';
import { PopupComponent } from '@lore/component/popup.component';
import { SceneControlsComponent } from '@lore/component/scene-controls.component';
import { SidebarComponent } from '@lore/component/sidebar.component';
import { TimelineComponent } from '@lore/component/timeline.component';
import { RepeatDirective } from '@app/directive/repeat.directive';
import { EngineComponent } from '@app/lore/engine/engine.component';
import { MaterialModule } from '@app/module/material.module';
import { LoreRoutingModule } from '@lore/routes/lore-routing.module';
import { ActorFormComponent } from './component/actor-form.component';
import { FocusDirective } from '@app/directive/focus.directive';
import { NgxMaskModule } from 'ngx-mask';

import { FormEntryComponent } from './component/form-entry.component';
import { LoreComponent } from './lore.component';
import { SharedModule } from '@app/shared/shared.module';

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
		RepeatDirective
	],
	imports: [
		SharedModule,
		MaterialModule,
		LoreRoutingModule,
		SkyhookDndModule.forRoot({ backendFactory: createDefaultMultiBackend }),
		NgxMaskModule.forRoot({})
	],
	entryComponents: [ActorFormComponent]
})
export class LoreModule {}

import { SkyhookDndModule } from '@angular-skyhook/core';
import { createDefaultMultiBackend, SkyhookMultiBackendModule } from '@angular-skyhook/multi-backend';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { Ng5SliderModule } from 'ng5-slider';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { MomentModule } from 'ngx-moment';
import { NgScrollbarModule, SmoothScrollModule } from 'ngx-scrollbar';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { BlockComponent } from './component/block/block.component';
import { CursorComponent } from './component/cursor/cursor.component';
import { HamburgerComponent } from './component/hamburger/hamburger.component';
import { LightControlComponent } from './component/light-control/light-control.component';
import { ListComponent } from './component/list/list.component';
import { PlayComponent } from './component/play/play.component';
import { PopupComponent } from './component/popup/popup.component';
import { SceneControlsComponent } from './component/scene-controls/scene-controls.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { TimelineComponent } from './component/timeline/timeline.component';
import { RepeatDirective } from './directive/repeat.directive';
import { EngineComponent } from './engine/engine.component';
import { MyHammerConfig } from './hammer-config.class';
import { MaterialModule } from './module/material.module';
import { RoutingModule } from './module/routing.module';
import { ActorFormComponent } from './component/actor-form/actor-form.component';
import { FocusDirective } from './directive/focus.directive';

@NgModule({
	declarations: [
		RepeatDirective,
		FocusDirective,
		AppComponent,
		AppComponent,
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
		ActorFormComponent
	],
	imports: [
		ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
		BrowserModule,
		BrowserAnimationsModule,
		NgScrollbarModule,
		Ng5SliderModule,
		SmoothScrollModule,
		MomentModule,
		RoutingModule,
		FormsModule,
		FontAwesomeModule,
		ReactiveFormsModule,
		DragDropModule,
		SkyhookMultiBackendModule,
		SkyhookDndModule.forRoot({ backendFactory: createDefaultMultiBackend }),
		DeviceDetectorModule.forRoot(),
		MaterialModule,
		OverlayModule
	],
	entryComponents: [ActorFormComponent],
	providers: [
		{
			provide: HAMMER_GESTURE_CONFIG,
			useClass: MyHammerConfig
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {}

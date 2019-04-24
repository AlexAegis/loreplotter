import { SkyhookDndModule } from '@angular-skyhook/core';
import { createDefaultMultiBackend, SkyhookMultiBackendModule } from '@angular-skyhook/multi-backend';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, HAMMER_GESTURE_CONFIG, HammerGestureConfig } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServiceWorkerModule } from '@angular/service-worker';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import * as Hammer from 'hammerjs';
import { MomentModule } from 'ngx-moment';
import { NgScrollbarModule, SmoothScrollModule } from 'ngx-scrollbar';

import { environment } from '../environments/environment';
import { AppComponent } from './app.component';
import { BlockComponent } from './component/block/block.component';
import { CursorComponent } from './component/cursor/cursor.component';
import { HamburgerComponent } from './component/hamburger/hamburger.component';
import { ListComponent } from './component/list/list.component';
import { PlayComponent } from './component/play/play.component';
import { PopupComponent } from './component/popup/popup.component';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { TimelineComponent } from './component/timeline/timeline.component';
import { RepeatDirective } from './directive/repeat.directive';
import { EngineComponent } from './engine/engine.component';
import { MaterialModule /*, GestureConfig */ } from './module/material.module';
import { RoutingModule } from './module/routing.module';
import { SceneControlsComponent } from './component/scene-controls/scene-controls.component';
import { MyHammerConfig } from './hammer-config.class';
import { DeviceDetectorModule } from 'ngx-device-detector';
@NgModule({
	declarations: [
		AppComponent,
		AppComponent,
		EngineComponent,
		PopupComponent,
		SidebarComponent,
		HamburgerComponent,
		TimelineComponent,
		RepeatDirective,
		ListComponent,
		CursorComponent,
		BlockComponent,
		PlayComponent,
		SceneControlsComponent
	],
	imports: [
		ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
		BrowserModule,
		BrowserAnimationsModule,
		NgScrollbarModule,
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
		MaterialModule
	],
	providers: [
		{
			provide: HAMMER_GESTURE_CONFIG,
			useClass: MyHammerConfig
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {}

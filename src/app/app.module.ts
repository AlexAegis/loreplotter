import { RepeatDirective } from './directive/repeat.directive';
import { EngineComponent } from './engine/engine.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { MomentModule } from 'ngx-moment';
import { AgGridModule } from 'ag-grid-angular';

import { AppComponent } from './app.component';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import * as Hammer from 'hammerjs';
import { PopupComponent } from './component/popup/popup.component';

import { NgScrollbarModule } from 'ngx-scrollbar';
import { SmoothScrollModule } from 'ngx-scrollbar';
import { RoutingModule } from './module/routing.module';
import { SidebarComponent } from './component/sidebar/sidebar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HamburgerComponent } from './component/hamburger/hamburger.component';
import { TimelineComponent } from './component/timeline/timeline.component';
import { MaterialModule } from './module/material.module';
import { ListComponent } from './component/list/list.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { CursorComponent } from './component/cursor/cursor.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { SkyhookDndModule } from '@angular-skyhook/core';
import { SkyhookMultiBackendModule, createDefaultMultiBackend } from '@angular-skyhook/multi-backend';
import { BlockComponent } from './component/block/block.component';
import { PlayComponent } from './component/play/play.component';

export class MyHammerConfig extends HammerGestureConfig {
	overrides = <any>{
		pan: { direction: Hammer.DIRECTION_ALL, threshold: 2, domEvents: true, options: { domEvents: true } }, // TODO what
		swipe: { velocity: 0.4, threshold: 20 } // override default settings
	};
}

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
		PlayComponent
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		NgScrollbarModule,
		SmoothScrollModule,
		AgGridModule,
		MomentModule,
		RoutingModule,
		FormsModule,
		FontAwesomeModule,
		ReactiveFormsModule,
		MaterialModule,
		DragDropModule,
		SkyhookMultiBackendModule,
		SkyhookDndModule.forRoot({ backendFactory: createDefaultMultiBackend }),
		ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
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

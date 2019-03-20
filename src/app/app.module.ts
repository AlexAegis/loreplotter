import { RepeatDirective } from './directive/repeat.directive';
import { EngineComponent } from './engine/engine.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
import { MomentModule } from 'ngx-moment';
import { AvatarModule } from 'ngx-avatar';
import { AgGridModule } from 'ag-grid-angular';

import { AppComponent } from './app.component';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import * as Hammer from 'hammerjs';
import { PopupComponent } from './component/popup/popup.component';
import { AkitaNgDevtools } from '@datorama/akita-ngdevtools';

import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

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
import { DatabaseService } from './database/database.service';
export class MyHammerConfig extends HammerGestureConfig {
	overrides = <any>{
		pan: { direction: Hammer.DIRECTION_ALL },
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
		ListComponent
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		NgScrollbarModule,
		SmoothScrollModule,
		AgGridModule,
		AkitaNgDevtools.forRoot(),
		MomentModule,
		AvatarModule,
		RoutingModule,
		FormsModule,
		ReactiveFormsModule,
		MaterialModule,
		ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
	],
	providers: [
		/*{
			provide: APP_INITIALIZER,
			useFactory: () => DatabaseService.init,
			multi: true,

},*/
		{
			provide: HAMMER_GESTURE_CONFIG,
			useClass: MyHammerConfig
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor() {
		library.add(fas, far);
	}
}

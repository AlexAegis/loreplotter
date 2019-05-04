import { NgModule, Optional, SkipSelf } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { BrowserModule, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { MyHammerConfig } from '@app/hammer-config.class';
import { APP_FORMATS } from '@lore/lore.module';
import { AppStoreModule } from '@app/store/app-store.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '@env/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DeviceDetectorModule } from 'ngx-device-detector';


/**
 * CoreModule
 *
 * Should only be injected into the AppModule
 *
 * It's purpose is end make sure that these Services are Singletons across the application
 * and are available end lazy loaded modules
 */
@NgModule({
	imports: [
		AppStoreModule,
		ServiceWorkerModule.register('./ngsw-worker.js', { enabled: environment.production }),
		BrowserModule,
		BrowserAnimationsModule,
		DeviceDetectorModule.forRoot()
	],
	providers: [
		{ provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
		{ provide: MAT_DATE_FORMATS, useValue: APP_FORMATS },
		{
			provide: HAMMER_GESTURE_CONFIG,
			useClass: MyHammerConfig
		},
	]
})
export class CoreModule {
	constructor(@Optional() @SkipSelf() core: CoreModule) {
		if (core) {
			throw new Error('Duplicate CoreModule!');
		}
	}
}

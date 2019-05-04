import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { RoutingModule } from '@app/routes';
import { CoreModule } from '@app/core.module';
import { LoadingComponent } from '@app/component/loading.component';
import { CommonModule } from '@angular/common';
import { InitService } from '@app/service/init.service';
import { SharedModule } from '@app/shared';

@NgModule({
	declarations: [AppComponent, LoadingComponent],
	imports: [SharedModule, RoutingModule, CoreModule],
	providers: [
		InitService,
		{
			provide: APP_INITIALIZER,
			useFactory: (initService: InitService) => initService.init,
			multi: true,
			deps: [InitService]
		}
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor() {}
}

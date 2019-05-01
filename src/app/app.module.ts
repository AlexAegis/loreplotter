import { APP_INITIALIZER, NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { RoutingModule } from '@app/routes';
import { CoreModule } from '@app/core.module';
import { LoadingComponent } from '@app/component/loading.component';
import { CommonModule } from '@angular/common';
import { DatabaseService } from '@app/service';
import { InitService } from '@app/service/init.service';

@NgModule({
	declarations: [AppComponent, LoadingComponent],
	imports: [CommonModule, RoutingModule, CoreModule],
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

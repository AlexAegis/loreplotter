import { APP_INITIALIZER, NgModule } from '@angular/core';
import { LoadingComponent } from '@app/component/loading.component';
import { CoreModule } from '@app/core.module';
import { RoutingModule } from '@app/routes';
import { InitService } from '@app/service/init.service';
import { SharedModule } from '@app/shared';
import { ActorFormComponent } from '@lore/component';
import { LoreFormComponent } from '@lore/component/lore-form.component';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { AppComponent } from './app.component';

@NgModule({
	declarations: [AppComponent, LoadingComponent],
	imports: [SharedModule, StoreRouterConnectingModule, RoutingModule, CoreModule],
	providers: [
		InitService,
		{
			provide: APP_INITIALIZER,
			useFactory: (initService: InitService) => initService.init,
			multi: true,
			deps: [InitService]
		}
	],
	entryComponents: [ActorFormComponent, LoreFormComponent],
	bootstrap: [AppComponent]
})
export class AppModule {
	public constructor() {}
}

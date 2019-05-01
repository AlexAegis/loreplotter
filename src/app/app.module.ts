import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { RoutingModule } from '@app/routes';
import { CoreModule } from '@app/core.module';
import { LoadingComponent } from '@app/component/loading.component';
import { CommonModule } from '@angular/common';

@NgModule({
	declarations: [AppComponent, LoadingComponent],
	imports: [
		CommonModule,
		RoutingModule,
		CoreModule
	],
	bootstrap: [AppComponent]
})
export class AppModule {
	constructor() {}
}

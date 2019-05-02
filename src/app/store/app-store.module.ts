import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';

import { environment } from '@env/environment';
import { reducers, metaReducers } from './reducers';

@NgModule({
	imports: [
		StoreModule.forRoot(reducers, { metaReducers }),
		EffectsModule.forRoot([]),
		StoreRouterConnectingModule,
		StoreDevtoolsModule.instrument({ logOnly: environment.production }),
	]
})
export class AppStoreModule {}

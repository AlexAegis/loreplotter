import { NgModule } from '@angular/core';

import { environment } from '@env/environment';
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { metaReducers, reducers } from './reducers';

@NgModule({
	imports: [
		StoreModule.forRoot(reducers, { metaReducers }),
		EffectsModule.forRoot([]),
		StoreRouterConnectingModule,
		StoreDevtoolsModule.instrument({ logOnly: environment.production })
	]
})
export class AppStoreModule {}

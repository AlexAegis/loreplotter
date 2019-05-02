import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducers } from './reducers';
import { LoreEffect } from './effect';
import { StoreFacade } from './store-facade.service';

export const APP_LORE_FEATURE_STATE_ID = 'app-lore';

@NgModule({
	imports: [
		StoreModule.forFeature(APP_LORE_FEATURE_STATE_ID, reducers),
		EffectsModule.forFeature([LoreEffect])
	],
	providers: [StoreFacade]
})
export class LoreStoreModule {}


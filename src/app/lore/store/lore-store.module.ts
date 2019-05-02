import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducer, STATE_ID } from './reducers';
import { LoreEffect } from './effect';
import { StoreFacade } from './store-facade.service';

@NgModule({
	imports: [StoreModule.forFeature(STATE_ID, reducer), EffectsModule.forFeature([LoreEffect])],
	providers: [StoreFacade]
})
export class LoreStoreModule {}

import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { reducer, STATE_ID } from './reducers';
import { LoreEffect } from './effect';
import { LoreFacade } from './lore.facade';

@NgModule({
	imports: [StoreModule.forFeature(STATE_ID, reducer), EffectsModule.forFeature([LoreEffect])],
	providers: [LoreFacade]
})
export class LoreStoreModule {}

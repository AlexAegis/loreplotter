import { NgModule } from '@angular/core';
import { ActorEffects, SceneEffects } from '@lore/store/effects';
import { ActorDeltaEffects } from '@lore/store/effects/actor-delta.effects';
import { LoreEffects } from '@lore/store/effects/lore.effects';
import { StoreFacade } from '@lore/store/store-facade.service';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { reducers } from './reducers';

export const APP_LORE_FEATURE_STATE_ID = 'app';

@NgModule({
	imports: [
		StoreModule.forFeature(APP_LORE_FEATURE_STATE_ID, reducers),
		EffectsModule.forFeature([LoreEffects, ActorEffects, ActorDeltaEffects, SceneEffects])
	],
	providers: [StoreFacade]
})
export class LoreStoreModule {}

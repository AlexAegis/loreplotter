import { APP_LORE_FEATURE_STATE_ID } from '@lore/store';
import { FeatureState } from '@lore/store/reducers';
import { AppState } from '@lore/store/reducers/app-lore.reducer';
import { createFeatureSelector } from '@ngrx/store';

export const getFeatureState = createFeatureSelector<AppState, FeatureState>(APP_LORE_FEATURE_STATE_ID);

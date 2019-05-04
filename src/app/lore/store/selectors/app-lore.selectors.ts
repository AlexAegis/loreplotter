import { FeatureState } from '@lore/store/reducers';
import { AppState } from '@lore/store/reducers/app-lore.reducer';
import { createFeatureSelector } from '@ngrx/store';

export const getFeatureState = createFeatureSelector<AppState, FeatureState>('app-lore');

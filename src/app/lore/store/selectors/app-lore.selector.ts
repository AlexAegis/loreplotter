import { FeatureState } from '@lore/store/reducers';
import { createFeatureSelector } from '@ngrx/store';
import { AppState } from '@lore/store/reducers/app-lore.reducer';

export const getFeatureState = createFeatureSelector<AppState, FeatureState>('app-lore');

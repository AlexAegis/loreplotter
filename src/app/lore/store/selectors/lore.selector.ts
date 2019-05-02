import { createFeatureSelector, createSelector } from '@ngrx/store';
import { loreAdapter, FeatureState } from '@lore/store/reducers';
import { State } from '@app/store/reducers';
import { getFeatureState } from '@lore/store/selectors/app-lore.selector';


/**
 * Selectors
 */
const { selectAll } = loreAdapter.getSelectors();


const getLoreState = createSelector(
	getFeatureState,
	(state) => state.lores
);

const getLores = createSelector(
	getLoreState,
	selectAll
);
const getLoading = createSelector(
	getLoreState,
	state => state.loading
);
const getSelected = createSelector(
	getLoreState,
	state => state.selected
);

/**
 * Queries
 */
export const loreQuery = {
	getLoading,
	getLores,
	getSelected
};
/*
const getlorestest = getLores({
	lores: { ids: ['0'], entities: { 0: {name: 'hello'}}, loading: false, selected: undefined },
	scene: { loading: false, playSpeed: 0 }
});

console.log('getlorestest');
console.log(getlorestest);*/

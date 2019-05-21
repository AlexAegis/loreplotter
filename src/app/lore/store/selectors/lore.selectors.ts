import { Lore } from '@app/model/data';
import { loreAdapter } from '@lore/store/reducers';
import { getFeatureState } from '@lore/store/selectors/app-lore.selectors';
import { Dictionary } from '@ngrx/entity';
import { createSelector } from '@ngrx/store';

/**
 * Selectors
 */
const { selectAll, selectEntities } = loreAdapter.getSelectors();

const getLoreState = createSelector(
	getFeatureState,
	state => state.lores
);

const getLores = createSelector(
	getLoreState,
	selectAll
);

const getLoreEntities = createSelector(
	getLoreState,
	selectEntities
);

const getLoading = createSelector(
	getLoreState,
	state => state.loading
);

const getSelectedId = createSelector(
	getLoreState,
	state => state.selected
);

const getSelected = createSelector(
	getLoreState,
	state => state.entities[state.selected]
);

const getSelectedPlanet = createSelector(
	getSelected,
	state => state && state.planet
);

const getSelectedPlanetRadius = createSelector(
	getSelectedPlanet,
	state => state && state.radius
);

const getSelectedPlanetName = createSelector(
	getSelectedPlanet,
	state => state && state.name
);

const getLoreEntityById = createSelector(
	getLoreEntities,
	(entities: Dictionary<Lore>, props: { id: string }) => {
		return entities[props.id];
	}
);

/**
 * Queries
 */
export const loreQuery = {
	getLoading,
	getLores,
	selected: {
		getSelectedId,
		getSelected,
		getSelectedPlanet,
		getSelectedPlanetRadius,
		getSelectedPlanetName
	},
	getLoreEntityById
};

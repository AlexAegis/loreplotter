import { OverridableProperty } from '@app/model';
import { Actor, ACTOR_DEFAULT_COLOR, ACTOR_DEFAULT_MAX_SPEED, ActorDelta, Property, Vec3 } from '@app/model/data';
import { actorAdapter, ActorEntity } from '@lore/store/reducers';
import { actorDeltaAdapter } from '@lore/store/reducers/actor-delta.reducer';
import { getFeatureState } from '@lore/store/selectors/app-lore.selectors';
import { sceneQuery } from '@lore/store/selectors/scene.selectors';
import { Dictionary } from '@ngrx/entity';
import { createSelector, defaultMemoize } from '@ngrx/store';

/**
 * Selectors
 */
const { selectAll, selectEntities } = actorAdapter.getSelectors();

const getActorState = createSelector(
	getFeatureState,
	state => state.actor
);

const getActors = createSelector(
	getActorState,
	selectAll
);

const getActorEntities = createSelector(
	getActorState,
	selectEntities
);

const getLoading = createSelector(
	getActorState,
	state => state.loading
);
const getSelected = createSelector(
	getActorState,
	state => state.selected
);

const getActorEntityById = createSelector(
	getActorEntities,
	(entities: Dictionary<ActorEntity>, props: { id: string }) => {
		return entities[props.id];
	}
);

export class AccumulatorField<T> {
	appearedIn: Partial<ActorDelta>;
	value: T;
	nextValue: T;
	nextAppearance: Partial<ActorDelta>;
}

export class ActorDeltaAccumulator {
	id = new AccumulatorField<string>();
	actorId = new AccumulatorField<string>();
	unix = new AccumulatorField<number>();
	name = new AccumulatorField<string>();
	maxSpeed = new AccumulatorField<number>();
	color = new AccumulatorField<string>();
	position = new AccumulatorField<Vec3>();
	properties: Array<AccumulatorField<Property>> = [];
}

const getActorsWithAccumulators = createSelector(
	[ getActorState, sceneQuery.cursor.getCursor],
	(state, cursor) =>
		actorAdapter
			.getSelectors()
			.selectAll(state)
			.map(actor => {
				const accumulator = new ActorDeltaAccumulator();
				const propertyMap = new Map<string, AccumulatorField<string>>();

				accumulator.color.value = ACTOR_DEFAULT_COLOR;
				accumulator.maxSpeed.value = ACTOR_DEFAULT_MAX_SPEED;

				let reached = false;
				for (const delta of actorDeltaAdapter
					.getSelectors()
					.selectAll(actor.deltas)) {
					if (delta.unix > cursor) {
						reached = true;
					}
					if (!reached) {
						if (delta.unix !== undefined) {
							accumulator.unix.value = delta.unix;
							accumulator.unix.appearedIn = delta;
						}
						if (delta.name !== undefined) {
							accumulator.name.value = delta.name;
							accumulator.name.appearedIn = delta;
						}
						if (delta.maxSpeed !== undefined) {
							accumulator.maxSpeed.value = delta.maxSpeed;
							accumulator.maxSpeed.appearedIn = delta;
						}
						if (delta.color !== undefined) {
							accumulator.color.value = delta.color;
							accumulator.color.appearedIn = delta;
						}
						if (delta.position !== undefined) {
							accumulator.position.value = delta.position;
							accumulator.position.appearedIn = delta;
						}
						for (const { key, value } of delta.properties) {
							const prop = propertyMap.get(key);
							if (prop) {
								prop.value = value;
								prop.appearedIn = delta;
							} else {
								const propField = new AccumulatorField<string>();
								propField.value = value;
								propField.appearedIn = delta;
								propertyMap.set(key, propField);
							}
						}
					} else {
						if (delta.unix !== undefined && accumulator.unix.nextAppearance === undefined) {
							accumulator.unix.nextValue = delta.unix;
							accumulator.unix.nextAppearance = delta;
						}
						if (delta.name !== undefined && accumulator.name.nextAppearance === undefined) {
							accumulator.name.nextValue = delta.name;
							accumulator.name.nextAppearance = delta;
						}
						if (delta.maxSpeed !== undefined && accumulator.maxSpeed.nextAppearance === undefined) {
							accumulator.maxSpeed.nextValue = delta.maxSpeed;
							accumulator.maxSpeed.nextAppearance = delta;
						}
						if (delta.color !== undefined && accumulator.color.nextAppearance === undefined) {
							accumulator.color.nextValue = delta.color;
							accumulator.color.nextAppearance = delta;
						}
						if (delta.position !== undefined && accumulator.position.nextAppearance === undefined) {
							accumulator.position.nextValue = delta.position;
							accumulator.position.nextAppearance = delta;
						}
						for (const { key, value } of delta.properties) {
							const prop = propertyMap.get(key);
							if (prop) {
								if (value !== undefined && prop.nextAppearance === undefined ) {
									prop.nextValue = value;
									prop.nextAppearance = delta;
								}
							} else {
								const propField = new AccumulatorField<string>();
								propField.nextValue = value;
								propField.nextAppearance = delta;
								propertyMap.set(key, propField);
							}
						}
					}
				}
				for (const [key, value] of propertyMap.entries()) {
					const accField = new AccumulatorField<Property>();
					accField.nextValue = { key, value: value.nextValue };
					accField.nextAppearance = value.nextAppearance;
					accField.appearedIn = value.appearedIn;
					accField.value = { key, value: value.value };
					accumulator.properties.push(accField);
				}

				return { cursor, actor, accumulator };
			})
);
export type Accumulator = {
	cursor: number;
	actor: Partial<ActorEntity>;
	accumulator: ActorDeltaAccumulator;
};

const getActorWithAccumulatorById = createSelector(
	getActorsWithAccumulators,
	(result: Array<Accumulator>, props: { id: string }) => result.find(res => res.actor.id === props.id)
);

/**
 * Queries
 */
export const actorQuery = {
	getLoading,
	getActors,
	getActorEntities,
	getActorEntityById,
	getActorsWithAccumulators,
	getActorWithAccumulatorById,
	getSelected
};

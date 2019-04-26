import { RxDatabase, RxCollection, RxJsonSchema, RxDocument } from 'rxdb';
import { Lore } from '../model/lore.class';
import { Actor } from '../model/actor.class';
import { Observable } from 'rxjs';
export interface RxCollections {
	lore: RxCollection<Lore, LoreDocumentMethods, LoreCollectionMethods>;
	actor: RxCollection<Actor>;
}

export type LoreDocument = RxDocument<Lore, LoreDocumentMethods>;

export interface LoreCollectionMethods {
	[countAllDocuments: string]: (
		this: RxCollection<Lore, LoreDocumentMethods, LoreCollectionMethods>
	) => Promise<number>;
}

export interface LoreDocumentMethods {
	collectActors: (
		this: RxDocument<Lore>,
		stateMapper: (actor: RxDocument<Actor, {}>) => RxDocument<Actor, {}>
	) => Observable<RxDocument<Actor>[]>;
}

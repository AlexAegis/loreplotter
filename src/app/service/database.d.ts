import { Actor, Lore } from '@app/model/data';
import { RxCollection, RxDocument } from 'rxdb';
import { Observable } from 'rxjs';

export interface RxCollections {
	lore: RxCollection<Lore, LoreDocumentMethods, LoreCollectionMethods>;
	actor: RxCollection<Actor>;
}

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

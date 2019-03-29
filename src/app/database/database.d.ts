import { RxDatabase, RxCollection, RxJsonSchema, RxDocument } from 'rxdb';
import { Lore } from '../model/lore.class';

export type LoreCollection = RxCollection<Lore, LoreDocumentMethods, LoreCollectionMethods>;

export type LoreDocument = RxDocument<Lore, LoreDocumentMethods>;

export interface LoreCollectionMethods {
	[countAllDocuments: string]: (this: LoreCollection) => Promise<number>;
}

export interface LoreDocumentMethods {
	[actorCount: string]: (this: Lore, name: string) => number;
}

export interface DatabaseCollections {
	[lore: string]: LoreCollection;
}

export type Database = RxDatabase<DatabaseCollections>;
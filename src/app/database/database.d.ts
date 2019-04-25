import { RxDatabase, RxCollection, RxJsonSchema, RxDocument } from 'rxdb';
import { Lore } from '../model/lore.class';

export type Database = RxDatabase<DatabaseCollections>;
export interface DatabaseCollections {
	lore: LoreCollection;
}

export type LoreCollection = RxCollection<Lore, LoreDocumentMethods, LoreCollectionMethods>;

export type LoreDocument = RxDocument<Lore, LoreDocumentMethods>;

export interface LoreCollectionMethods {
	[countAllDocuments: string]: (this: LoreCollection) => Promise<number>;
}

export interface LoreDocumentMethods {
	[methodName: string]: (this: Lore) => any;
}

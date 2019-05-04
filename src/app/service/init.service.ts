import { Injectable } from '@angular/core';
import * as idb from 'pouchdb-adapter-idb';
import RxDB from 'rxdb';

/**
 * This service will be called when the application starts
 */
@Injectable()
export class InitService {

	private success = true;

	public async init(): Promise<boolean> {
		return this.success;
	}

	public constructor() {
		RxDB.plugin(idb);
	}
}

import { Injectable } from '@angular/core';
import * as idb from 'pouchdb-adapter-idb';
import RxDB from 'rxdb';

/**
 * This service will be called when the application starts
 */
@Injectable()
export class InitService {
	public async init() {
		return 0;
	}

	constructor() {
		RxDB.plugin(idb);
	}
}

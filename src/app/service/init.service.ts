import { Injectable } from '@angular/core';
import RxDB from 'rxdb';
import * as idb from 'pouchdb-adapter-idb';

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

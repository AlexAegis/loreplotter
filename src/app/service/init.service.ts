import { Injectable } from '@angular/core';
import RxDB from 'rxdb';
import * as idb from 'pouchdb-adapter-idb';

@Injectable()
export class InitService {

	init() {
	}

	constructor() {
		RxDB.plugin(idb);
	}

}

import { TestBed } from '@angular/core/testing';

import { LoreService } from './lore.service';

describe('LoreService', () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it('should be created', () => {
		const service: LoreService = TestBed.get(LoreService);
		expect(service).toBeTruthy();
	});
});

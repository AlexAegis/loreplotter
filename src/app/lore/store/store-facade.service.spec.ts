import { TestBed } from '@angular/core/testing';
import { StoreFacade } from '@lore/store/store-facade.service';

describe('StoreFacadeService', () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it('should be created', () => {
		const service: StoreFacade = TestBed.get(StoreFacade);
		expect(service).toBeTruthy();
	});
});

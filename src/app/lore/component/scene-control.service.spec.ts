import { TestBed } from '@angular/core/testing';

import { SceneControlService } from '@lore/service';

describe('SceneControlService', () => {
	beforeEach(() => TestBed.configureTestingModule({}));

	it('should be created', () => {
		const service: SceneControlService = TestBed.get(SceneControlService);
		expect(service).toBeTruthy();
	});
});

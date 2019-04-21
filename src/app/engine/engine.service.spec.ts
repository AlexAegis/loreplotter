import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { EngineService } from './engine.service';

describe('EngineService', () => {
	let service: EngineService;
	let canvas: HTMLCanvasElement;

	beforeAll(async () => {
		service = new EngineService(undefined);
		canvas = document.createElement('canvas');
	});

	beforeEach(async(() => {}));

	it('should create the scene, and a globe', () => {
		service.createScene(canvas);
		expect(service.globe).toBeTruthy();
	});
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SceneControlsComponent } from './scene-controls.component';

describe('SceneControlsComponent', () => {
	let component: SceneControlsComponent;
	let fixture: ComponentFixture<SceneControlsComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [SceneControlsComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(SceneControlsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});

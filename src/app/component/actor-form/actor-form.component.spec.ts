import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ActorFormComponent } from './actor-form.component';

describe('ActorFormComponent', () => {
	let component: ActorFormComponent;
	let fixture: ComponentFixture<ActorFormComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [ActorFormComponent]
		}).compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(ActorFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
